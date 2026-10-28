import { redirect } from "next/navigation";

/* The welcome used to ask for the property straight after the name. It is
   the dashboard's job now — an old link lands on the same form there. */
export default function Page() {
  redirect("/app/properties/new?then=book");
}
