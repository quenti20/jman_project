import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkSessionCard from '../../../Components/WorkSessionCard/WorkSessionCard';
import './EmployeeTraining.css'; // Import the CSS file

// Function to format date as dd-mm-yyyy
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const EmployeeTraining = () => {
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [works, setWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [showDetails, setShowDetails] = useState({}); // State to track showing/hiding details

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get('http://localhost:5000/getAllModules');
        // Filter modules to include only those with UserType as 'Employee'
        const filteredModules = response.data.modules.filter(module => module.UserType === 'Employee');
        setModules(filteredModules.map(module => ({
          ...module,
          Date: formatDate(module.Date) // Format module date
        })));
        setLoadingModules(false);
        // Initialize showDetails state for each module as false
        setShowDetails(filteredModules.reduce((acc, module) => {
          acc[module._id] = false;
          return acc;
        }, {}));
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, []);

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/getAllWorks');
        setWorks(response.data.works.map(work => ({
          ...work,
          date: formatDate(work.date.split('T')[0]) // Format work session date
        })));
        setLoadingWorks(false);
      } catch (error) {
        console.error('Error fetching works:', error);
      }
    };

    fetchWorks();
  }, []);

  if (loadingModules || loadingWorks) {
    return <div>Loading...</div>;
  }

  const toggleDetails = (moduleId) => {
    setShowDetails({ ...showDetails, [moduleId]: !showDetails[moduleId] });
  };

  const parseTime = (timeString) => {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hours24 = hours;
    if (period === 'PM' && hours < 12) {
        hours24 += 12;
    }
    const date = new Date();
    date.setHours(hours24, minutes, 0, 0);
    return date;
  };

  // Function to calculate the time interval between start_time and end_time
  const calculateTimeInterval = (startTime, endTime) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const interval = Math.abs(end - start) / 36e5; // Convert milliseconds to hours
    return interval;
  };

  // Function to calculate the total hours for each WorkSession
  const calculateTotalHours = (worksByDate) => {
    let totalHours = 0;
    worksByDate.forEach((work) => {
        const { start_time, end_time } = work;
        const interval = calculateTimeInterval(start_time, end_time);
        totalHours += interval;
    });
    return totalHours;
  };

  // Calculate total hours per WorkSession and hours left to be assigned from 8 hours
  const calculateHoursLeft = (worksByDate) => {
    const totalHours = calculateTotalHours(worksByDate);
    const hoursLeft = 8 - totalHours;
    return hoursLeft;
  };

  return (
    <div>
      <h2>Module List</h2>
      <ul className="module-list">
        {modules.map((module) => (
          <li key={module._id} className="module">
            <div className="module-header">
              <h3>{module.TrainingName}</h3>
              <button onClick={() => toggleDetails(module._id)}>
                {showDetails[module._id] ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            {showDetails[module._id] && (
              <div className="module-details">
                <p><strong>COE Name:</strong> {module.Coe_Name}</p>
                <p><strong>User Type:</strong> {module.UserType}</p>
                <p><strong>Date:</strong> {formatDate(module.Date)}</p>
                {Object.entries(
                  works.filter((work) => module.WorkSessions.includes(work._id)).reduce((acc, work) => {
                    const date = work.date;
                    if (!acc[date]) {
                      acc[date] = [];
                    }
                    acc[date].push(work);
                    return acc;
                  }, {})
                ).map(([date, worksByDate]) => (
                  <div key={date}>
                    <h4 className="work-session-date">Work Sessions Date: {date}</h4>
                    <p>Total Hours: {calculateTotalHours(worksByDate)}</p>
                    <p>Hours Left: {calculateHoursLeft(worksByDate)}</p>
                    <ul>
                      {worksByDate.map((work) => (
                        <li key={work._id}>
                          <WorkSessionCard className={`WorkSessionCard ${work.WorkType}`} work={work} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmployeeTraining;
