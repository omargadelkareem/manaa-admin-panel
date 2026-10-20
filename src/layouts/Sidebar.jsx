import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { navigation } from "../../constants/navigation";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">M</div>

          <div className="brand-copy">
            <strong>مناع للزجاج</strong>
            <span>Manaa HR</span>
          </div>

          <button className="sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-company">
          <div className="company-avatar">م</div>

          <div>
            <strong>شركة مناع للزجاج</strong>
            <span>الموارد البشرية</span>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {navigation.map((section, index) => (
            <div className="nav-section" key={index}>
              {section.title && (
                <div className="nav-section-title">{section.title}</div>
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
                        `nav-item ${isActive ? "active" : ""}`
                      }
                    >
                      <Icon size={19} strokeWidth={1.9} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">HR</div>

          <div>
            <strong>Manaa HR</strong>
            <span>نظام إدارة الموارد البشرية</span>
          </div>
        </div>
      </aside>
    </>
  );
}