export default function AdminFooter() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-700">Admin Panel</span>
            <span>•</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs">Version 1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

