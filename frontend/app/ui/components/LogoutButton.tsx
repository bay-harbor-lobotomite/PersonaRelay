"use client"; 
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 font-semibold text-whiterounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out cursor-pointer" style={{ backgroundColor: "var(--color-accent-primary)", color: "var(--color-text-primary)"}}
    >
      Logout
    </button>
  );
}