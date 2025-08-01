// src/components/Dashboard/Sidebar/Sidebar.jsx
import React from 'react';
import styles from './Sidebar.module.css'; // Regular CSS import

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const navItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'New Job Requests', icon: '🆕' },
    { name: 'Ongoing Projects', icon: '🔄' },
    { name: 'Completed Projects', icon: '✅' },
    { name: 'Clients', icon: '👥' },
    { name: 'Messages', icon: '💬' },
    { name: 'Calendar', icon: '📅' }
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarContent}>
        {/* User Profile Section */}
        <div className={styles.profileSection}>
          <div className={styles.avatar}>👨‍💼</div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>Alex Johnson</h3>
            <p className={styles.userRole}>Project Manager</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navMenu}>
          <ul className={styles.navList}>
            {navItems.map((item, index) => (
              <li key={index}>
                <button
                  className={`${styles.navItem} ${activeTab === item.name ? styles.active : ''}`}
                  onClick={() => setActiveTab(item.name)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navText}>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Buttons */}
        <div className={styles.bottomButtons}>
          <button className={styles.settingsButton}>
            <span className={styles.buttonIcon}>⚙️</span>
            <span className={styles.buttonText}>Settings</span>
          </button>
          <button className={styles.editProfileButton}>
            <span className={styles.buttonIcon}>✏️</span>
            <span className={styles.buttonText}>Edit Profile</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
