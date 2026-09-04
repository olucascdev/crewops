export type ServiceAddressSnapshotSource = {
  id: string;
  label: string;
  street: string;
  number: string | null;
  district: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  contactName: string | null;
  contactPhone: string | null;
  instructions: string | null;
};

/** Creates a detached, serializable snapshot; it never mutates the address row. */
export function snapshotServiceAddress(address: ServiceAddressSnapshotSource) {
  return {
    addressId: address.id, label: address.label, street: address.street, number: address.number,
    district: address.district, city: address.city, state: address.state, postalCode: address.postalCode,
    latitude: address.latitude, longitude: address.longitude, contactName: address.contactName,
    contactPhone: address.contactPhone, instructions: address.instructions,
  };
}
