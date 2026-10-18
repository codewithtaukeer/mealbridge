import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-warm-ivory">
      {/* Navbar will be added in Phase 1 */}
      <main>
        <Outlet />
      </main>
      {/* Footer will be added in Phase 1 */}
    </div>
  );
}
