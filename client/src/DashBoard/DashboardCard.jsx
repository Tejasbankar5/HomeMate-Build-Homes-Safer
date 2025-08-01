import React from 'react';
import PropTypes from 'prop-types';
import styles from './DashboardCard.module.css'; // Regular CSS import

const DashboardCard = ({ title, value, color, icon }) => {
  return (
    <div className={styles.card} style={{ backgroundColor: color }}>
      <div className={styles.cardContent}>
        <div className={styles.cardIcon}>{icon}</div>
        <div className={styles.cardText}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardValue}>{value}</p>
        </div>
      </div>
    </div>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired
};

export default DashboardCard;