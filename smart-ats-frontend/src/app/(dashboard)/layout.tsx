'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuToggle={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
// import Sidebar from '@/components/layout/Sidebar';
// import Header from '@/components/layout/Header';

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="flex h-screen bg-slate-50 overflow-hidden">
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
//         <main className="flex-1 overflow-y-auto p-6">
//           <div className="max-w-7xl mx-auto animate-fade-in">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }
