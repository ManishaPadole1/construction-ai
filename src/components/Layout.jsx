import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function Layout({ children, currentScreen, onNavigate }) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar currentScreen={currentScreen} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
