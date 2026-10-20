import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

import { navigation } from "../../constants/navigation.js";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">م</div>

          <div className="brand-copy">
            <strong>مناع للزجاج</strong>
            <span>Manaa HR</span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-company">
          <div className="company-avatar">HR</div>

          <div>
            <strong>الموارد البشرية</strong>
            <span>لوحة الإدارة</span>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {navigation.map((section, sectionIndex) => (
            <div className="nav-section" key={sectionIndex}>
              {section.title && (
                <div className="nav-section-title">
                  {section.title}
                </div>
              )}

              <div className="nav-items">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `nav-item ${
                          isActive ? "active" : ""
                        }`
                      }
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>Manaa HR</strong>
          <span>نظام إدارة الموظفين</span>
        </div>
      </aside>
    </>
  );
}
