import { Bell, ChevronDown, Menu, Search } from "lucide-react";

export default function Header({ onMenuClick }) {
  return (
    <header className="top-header">
      <div className="header-right">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
        >
          <Menu size={22} />
        </button>

        <div className="header-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="ابحث عن موظف، تقرير أو طلب..."
          />

          <kbd>⌘ K</kbd>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="notification-button"
          aria-label="الإشعارات"
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="header-divider" />

        <button type="button" className="user-menu">
          <div className="user-avatar">OA</div>

          <div className="user-information">
            <strong>مسؤول النظام</strong>
            <span>Administrator</span>
          </div>

          <ChevronDown size={17} />
        </button>
      </div>
    </header>
  );
}