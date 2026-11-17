export type BookingKind = "campino" | "eventi";
export const eventTypes = ["Compleanno", "Evento CVA", "Evento esterno"] as const;
export type EventType = typeof eventTypes[number];

export function validEventType(value: string): value is EventType {
  return eventTypes.some((type) => type === value);
}

export function managementPath(kind: BookingKind) {
  return kind === "eventi" ? "/gestione/eventi" : "/gestione";
}
