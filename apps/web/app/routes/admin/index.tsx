import { Link } from "@remix-run/react";

export default function AdminRoute() {
  return (
    <div>
      <h1>Admin</h1>
      <ul>
        <li>
          <Link to="factions">Factions</Link>
        </li>
      </ul>
    </div>
  );
}
