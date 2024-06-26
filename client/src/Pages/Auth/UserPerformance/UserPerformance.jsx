import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserPerformance.css'; // Import CSS file for styling

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

const formatTime = (timeString) => {
    const time = new Date(timeString);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return time.toLocaleTimeString('en-US', options);
};

const getLoadingBarClass = (marksObtained) => {
    return marksObtained >= 85 ? 'GreenLoadingBar' : marksObtained >= 60 ? 'YellowLoadingBar' : 'RedLoadingBar';
};

const getLoadingBarWidth = (marksObtained) => {
    return (marksObtained / 100) * 100;
};

const UserPerformanceDetails = () => {
    const [userData, setUserData] = useState(null);
    const [userPerformance, setUserPerformance] = useState([]);
    const [allWorks, setAllWorks] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
    
        const fetchData = async () => {
            if (token) {
                try {
                    // Fetch user data
                    const userDataResponse = await axios.get(`http://localhost:5000/getUser/${token}`, {
                        headers: {
                            Authorization: token
                        }
                    });
                    setUserData(userDataResponse.data);
    
                    // Fetch all performance data
                    const performanceDataResponse = await axios.get('http://localhost:5000/getAllPerformance', {
                        headers: {
                            Authorization: token
                        }
                    });
                    setUserPerformance(performanceDataResponse.data.data);
    
                    // Fetch all works data
                    const worksDataResponse = await axios.get('http://localhost:5000/getAllWorks', {
                        headers: {
                            Authorization: token
                        }
                    });
                    setAllWorks(worksDataResponse.data.works);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };
    
        fetchData();
    }, []);

    const getAssessmentDetails = () => {
        if (!userData || !userPerformance.length || !allWorks.length) {
            return <p>Loading...</p>;
        }

        const userEmail = userData.email;

        const userPerformanceData = userPerformance.filter(perf => perf.email === userEmail);

        const assessments = userPerformanceData.map(perf => {
            const matchingWork = allWorks.find(work => work._id === perf.Ass_id);
            return { ...perf, matchingWork };
        });

        return (
            <div className="PerformanceContainer">
                <h1>User Performance Details</h1>
                <div className="TestReportsHeader">
                    <h2>Test Reports for {userData.name}</h2>
                </div>
                <div className="UserInfoContainer">
                    <p>Email: {userData.email}</p>
                    <p>User Type: {userData.userType}</p>
                </div>
                <div className="Assessment_Details">
                    <h2>Assessment Details</h2>
                </div>
                <div className="AssessmentContainer">
                    {assessments.map(assessment => (
                        <div key={assessment._id} className="AssessmentItem">
                            <p>Test Name: {assessment.matchingWork.testName}</p>
                            <p>Date: {formatDate(assessment.matchingWork.date)}</p>
                            <p>Start Time: {formatTime(assessment.matchingWork.start_time)}</p>
                            <p>End Time: {formatTime(assessment.matchingWork.end_time)}</p>
                            <p>Marks Obtained: {assessment.Marks_Obtained}/{assessment.Total_Marks}</p>
                            <div className="LoadingBarContainer">
                                <div className={getLoadingBarClass(assessment.Marks_Obtained)} style={{ width: `${getLoadingBarWidth(assessment.Marks_Obtained)}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="UserPerformanceDetailsContainer">
            {getAssessmentDetails()}
        </div>
    );
};

export default UserPerformanceDetails;
