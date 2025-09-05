import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FaChartBar } from 'react-icons/fa';
import './DomainQueryCharts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DomainQueryCharts = () => {
  const [domainStats, setDomainStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDomainStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/statistics/domains');
      setDomainStats(response.data.statistics);
      setLastUpdated(new Date());
      setError('');
    } catch (error) {
      setError('Failed to load domain statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainStats();
  }, []);



  // Filter out specific domains
  const excludedDomains = ['analog design', 'architecture', 'design', 'dft', 'specification'];
  const filteredDomainStats = domainStats.filter(domain => 
    !excludedDomains.includes(domain.domain_name.toLowerCase())
  );

  // Prepare data for bar chart (total queries per domain)
  const barChartData = {
    labels: filteredDomainStats.map(domain => domain.domain_name),
    datasets: [
      {
        label: 'Total Queries',
        data: filteredDomainStats.map(domain => domain.total_queries),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
      {
        label: 'Open Queries',
        data: filteredDomainStats.map(domain => domain.open_queries),
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1,
      },
      {
        label: 'In Progress',
        data: filteredDomainStats.map(domain => domain.in_progress_queries),
        backgroundColor: 'rgba(23, 162, 184, 0.8)',
        borderColor: 'rgba(23, 162, 184, 1)',
        borderWidth: 1,
      },
      {
        label: 'Resolved',
        data: filteredDomainStats.map(domain => domain.resolved_queries),
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Query Distribution by Domain',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Prepare data for doughnut chart (overall status distribution)
  const totalOpen = filteredDomainStats.reduce((sum, domain) => sum + domain.open_queries, 0);
  const totalInProgress = filteredDomainStats.reduce((sum, domain) => sum + domain.in_progress_queries, 0);
  const totalResolved = filteredDomainStats.reduce((sum, domain) => sum + domain.resolved_queries, 0);

  const doughnutChartData = {
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [totalOpen, totalInProgress, totalResolved],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',
          'rgba(23, 162, 184, 0.8)',
          'rgba(40, 167, 69, 0.8)',
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(23, 162, 184, 1)',
          'rgba(40, 167, 69, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Overall Query Status Distribution',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  if (loading && domainStats.length === 0) {
    return (
      <div className="domain-charts">
        <div className="charts-header">
          <h2><FaChartBar /> Domain Query Analytics</h2>
        </div>
        <div className="loading">Loading charts...</div>
      </div>
    );
  }

  return (
    <div className="domain-charts">
      <div className="charts-header">
        <h2><FaChartBar /> Domain Query Analytics</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-wrapper">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-wrapper">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>
      </div>


    </div>
  );
};

export default DomainQueryCharts;