import type { Request, Response } from "express";
import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { AuthLoginInput, AuthMe } from "@crewops/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { authLoginSchema } from "./dto/login.dto";
import { AuthenticatedGuard } from "../../common/guards/authenticated.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedRequest, RequestUser } from "../../common/auth/session.types";
import type { ApiConfig } from "../config";
import { AuthService } from "./auth.service";

const ACCESS_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias
const CSRF_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

/**
 * Session endpoints (plan 6.2). Painel e PWA usam o mesmo canal: cookies
 * `HttpOnly` + `SameSite=Strict` (access/refresh) e double-submit CSRF cookie.
 *
 * - `login` (público, CSRF): autentica, cria sessão, seta os 3 cookies.
 * - `refresh` (público, CSRF): valida o refresh token hash, emite novo access.
 * - `logout` (público, CSRF): revoga a sessão e limpa os cookies (idempotente).
 * - `me` (autenticado): perfil da sessão.
 * - `csrf` (GET): entrega/gera o token CSRF no cookie.
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ApiConfig,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(authLoginSchema)) input: AuthLoginInput,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(input, {
      ip: req.ip ?? "",
      userAgent: req.headers["user-agent"],
    });
    this.setSessionCookies(res, result.accessToken, result.refreshToken, result.csrfToken);
    return { user: result.user, redirectTo: result.redirectTo };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() req: AuthenticatedRequest & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.refresh(req.cookies?.refresh_token, {
      ip: req.ip ?? "",
      userAgent: req.headers["user-agent"],
    });
    // Refresh token não rotaciona neste grupo: mantém o cookie existente,
    // apenas renova o access token e o token CSRF.
    res.cookie("access_token", result.accessToken, this.cookieOptions(ACCESS_TTL_SECONDS));
    res.cookie("csrf_token", this.auth.generateCsrfToken(), {
      ...this.cookieOptions(CSRF_TTL_SECONDS),
      httpOnly: false,
    });
    return { ok: true as const, user: result.user };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() req: AuthenticatedRequest & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.refresh_token, {
      ip: req.ip ?? "",
      userAgent: req.headers["user-agent"],
    });
    this.clearCookies(res);
    return { ok: true as const };
  }

  @Get("me")
  @UseGuards(AuthenticatedGuard)
  async me(@CurrentUser() user: RequestUser): Promise<AuthMe> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
    };
  }

  @Get("csrf")
  async csrf(@Res({ passthrough: true }) res: Response): Promise<{ csrfToken: string; }> {
    const csrfToken = this.auth.generateCsrfToken();
    res.cookie("csrf_token", csrfToken, {
      ...this.cookieOptions(CSRF_TTL_SECONDS),
      httpOnly: false,
    });
    return { csrfToken };
  }

  private cookieOptions(maxAgeSeconds: number) {
    return {
      httpOnly: true,
      secure: this.config.env === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private setSessionCookies(res: Response, accessToken: string, refreshToken: string, csrfToken: string): void {
    res.cookie("access_token", accessToken, this.cookieOptions(ACCESS_TTL_SECONDS));
    res.cookie("refresh_token", refreshToken, this.cookieOptions(REFRESH_TTL_SECONDS));
    res.cookie("csrf_token", csrfToken, {
      ...this.cookieOptions(CSRF_TTL_SECONDS),
      httpOnly: false,
    });
  }

  private clearCookies(res: Response): void {
    for (const name of ["access_token", "refresh_token", "csrf_token"]) {
      res.cookie(name, "", { ...this.cookieOptions(0), maxAge: 0 });
    }
  }
}
