import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4">
      <h1 className="text-4xl md:text-6xl font-bold glow-text text-center select-none">
        Knowledge Base
      </h1>
      <p className="mt-6 text-text-secondary text-lg text-center max-w-md">
        AI 驱动的个人知识管理系统
      </p>
      <div className="mt-12 flex gap-4">
        <div className="w-2 h-2 rounded-full bg-star-white animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-star-white animate-pulse" style={{ animationDelay: "0.3s" }} />
        <div className="w-2 h-2 rounded-full bg-star-white animate-pulse" style={{ animationDelay: "0.6s" }} />
      </div>
      <Link
        href="/explore"
        className="mt-12 inline-flex items-center gap-2 rounded-lg bg-nebula-purple/80 px-6 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:bg-nebula-purple transition-all"
      >
        开始探索
      </Link>
    </div>
  );
}
