import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4 text-center">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-4">KidTutor</h1>
      <p className="text-xl text-gray-700 mb-8 max-w-md">
        The best online tutoring for kids in Bahir Dar. Simple, fast, and fun!
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Link 
          href="/login" 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all text-center"
        >
          Login
        </Link>
        <Link 
          href="/signup" 
          className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all text-center"
        >
          Sign Up
        </Link>
      </div>
      
      <p className="mt-12 text-sm text-gray-500">Optimized for local performance</p>
    </div>
  );
}