import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllJobs, applyForJob, getMyStatus, acknowledge, withdraw } from "../api";

function ApplicantDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "applicant") {
      navigate("/login");
      return;
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getAllJobs();
      setJobs(res.data.jobs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyStatus = async (jobId) => {
    try {
      const res = await getMyStatus(jobId);
      setMyApplication(res.data.application);
      setMessage(res.data.message);
    } catch (err) {
      setMyApplication(null);
      setMessage("");
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setMyApplication(null);
    setMessage("");
    fetchMyStatus(job._id);
  };

  const handleApply = async (jobId) => {
    setLoading(true);
    try {
      const res = await applyForJob(jobId);
      setMessage(res.data.message);
      setMyApplication(res.data.application);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to apply");
    }
    setLoading(false);
  };

  const handleAcknowledge = async (jobId) => {
    setLoading(true);
    try {
      const res = await acknowledge(jobId);
      setMessage(res.data.message);
      fetchMyStatus(jobId);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to acknowledge");
    }
    setLoading(false);
  };

  const handleWithdraw = async (jobId) => {
    setLoading(true);
    try {
      const res = await withdraw(jobId);
      setMessage(res.data.message);
      setMyApplication(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to withdraw");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return { bg: "#dcfce7", color: "#16a34a" };
      case "waitlisted": return { bg: "#fef9c3", color: "#ca8a04" };
      case "withdrawn": return { bg: "#fee2e2", color: "#dc2626" };
      case "hired": return { bg: "#dbeafe", color: "#2563eb" };
      case "rejected": return { bg: "#fee2e2", color: "#dc2626" };
      default: return { bg: "#f3f4f6", color: "#666" };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>XcelCrowd</h1>
        <div style={styles.headerRight}>
          <span style={styles.welcomeText}>Welcome, {user?.name}!</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Left Panel - Jobs List */}
        <div style={styles.leftPanel}>
          <h2 style={styles.panelTitle}>Available Jobs</h2>
          {jobs.length === 0 ? (
            <div style={styles.emptyState}>No jobs available right now</div>
          ) : (
            jobs.map((job) => (
              <div
                key={job._id}
                style={{
                  ...styles.jobCard,
                  borderLeft: selectedJob?._id === job._id
                    ? "4px solid #4f46e5"
                    : "4px solid transparent",
                }}
                onClick={() => handleSelectJob(job)}
              >
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <p style={styles.companyName}>{job.company?.name}</p>
                <div style={styles.jobMeta}>
                  <span style={styles.capacity}>
                    Capacity: {job.activeCapacity}
                  </span>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: "#dcfce7",
                    color: "#16a34a",
                  }}>
                    Open
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel - Job Detail & Application */}
        <div style={styles.rightPanel}>
          {!selectedJob ? (
            <div style={styles.emptyPipeline}>
              <h2>👈 Select a job to apply</h2>
              <p>Click on any job from the left panel</p>
            </div>
          ) : (
            <>
              {/* Job Details */}
              <div style={styles.jobDetailCard}>
                <h2 style={styles.jobDetailTitle}>{selectedJob.title}</h2>
                <p style={styles.jobDetailCompany}>
                  {selectedJob.company?.name}
                </p>
                <p style={styles.jobDetailDesc}>{selectedJob.description}</p>
                <div style={styles.jobDetailMeta}>
                  <span style={styles.metaItem}>
                    👥 Active Capacity: {selectedJob.activeCapacity}
                  </span>
                  <span style={styles.metaItem}>
                    ✅ Status: Open
                  </span>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div style={styles.messageBox}>
                  {message}
                </div>
              )}

              {/* Application Status */}
              {myApplication ? (
                <div style={styles.applicationCard}>
                  <h3 style={styles.applicationTitle}>Your Application</h3>

                  {/* Status Badge */}
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(myApplication.status).bg,
                    color: getStatusColor(myApplication.status).color,
                  }}>
                    {myApplication.status.toUpperCase()}
                  </div>

                  {/* Waitlist Position */}
                  {myApplication.status === "waitlisted" && (
                    <div style={styles.positionCard}>
                      <div style={styles.positionNumber}>
                        #{myApplication.waitlistPosition}
                      </div>
                      <div style={styles.positionLabel}>
                        Your position in waitlist
                      </div>
                    </div>
                  )}

                  {/* Acknowledge button for active unacknowledged */}
                  {myApplication.status === "active" &&
                    !myApplication.acknowledgedAt && (
                      <div style={styles.acknowledgeBox}>
                        <p style={styles.acknowledgeText}>
                          ⚠️ You have been promoted! Please acknowledge
                          within 48 hours to keep your spot.
                        </p>
                        <button
                          style={styles.acknowledgeBtn}
                          onClick={() => handleAcknowledge(selectedJob._id)}
                          disabled={loading}
                        >
                          {loading ? "..." : "✅ I Acknowledge"}
                        </button>
                      </div>
                    )}

                  {/* Acknowledged message */}
                  {myApplication.status === "active" &&
                    myApplication.acknowledgedAt && (
                      <div style={styles.acknowledgedMsg}>
                        ✅ You have acknowledged your promotion!
                      </div>
                    )}

                  {/* Withdraw button */}
                  {(myApplication.status === "active" ||
                    myApplication.status === "waitlisted") && (
                    <button
                      style={styles.withdrawBtn}
                      onClick={() => handleWithdraw(selectedJob._id)}
                      disabled={loading}
                    >
                      {loading ? "..." : "Withdraw Application"}
                    </button>
                  )}

                  {/* Application Logs */}
                  <h4 style={styles.logsTitle}>Activity Log</h4>
                  <div style={styles.logsContainer}>
                    {myApplication.logs.map((log, index) => (
                      <div key={index} style={styles.logItem}>
                        <div style={styles.logAction}>{log.action}</div>
                        <div style={styles.logDetails}>{log.details}</div>
                        <div style={styles.logTime}>
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Apply Button */
                <div style={styles.applyCard}>
                  <p style={styles.applyText}>
                    You haven't applied for this job yet!
                  </p>
                  <button
                    style={styles.applyBtn}
                    onClick={() => handleApply(selectedJob._id)}
                    disabled={loading}
                  >
                    {loading ? "Applying..." : "Apply Now"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  header: {
    backgroundColor: "#4f46e5",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: "24px", fontWeight: "bold" },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  welcomeText: { color: "white", fontSize: "14px" },
  logoutBtn: {
    padding: "8px 16px",
    backgroundColor: "white",
    color: "#4f46e5",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
  },
  content: { display: "flex", height: "calc(100vh - 60px)" },
  leftPanel: {
    width: "320px",
    backgroundColor: "white",
    borderRight: "1px solid #e5e7eb",
    padding: "20px",
    overflowY: "auto",
  },
  panelTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  jobCard: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginBottom: "10px",
    cursor: "pointer",
  },
  jobTitle: { fontSize: "15px", fontWeight: "600", marginBottom: "4px" },
  companyName: { fontSize: "13px", color: "#666", marginBottom: "6px" },
  jobMeta: { display: "flex", alignItems: "center", gap: "10px" },
  badge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  capacity: { fontSize: "12px", color: "#666" },
  emptyState: {
    color: "#666",
    fontSize: "14px",
    textAlign: "center",
    padding: "20px",
  },
  rightPanel: { flex: 1, padding: "24px", overflowY: "auto" },
  emptyPipeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#666",
    gap: "10px",
  },
  jobDetailCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  jobDetailTitle: { fontSize: "22px", fontWeight: "bold", marginBottom: "4px" },
  jobDetailCompany: { color: "#4f46e5", fontWeight: "600", marginBottom: "10px" },
  jobDetailDesc: { color: "#555", fontSize: "14px", marginBottom: "12px" },
  jobDetailMeta: { display: "flex", gap: "20px" },
  metaItem: { fontSize: "13px", color: "#666" },
  messageBox: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontWeight: "600",
  },
  applicationCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  applicationTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    marginBottom: "16px",
  },
  positionCard: {
    backgroundColor: "#f0f2f5",
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center",
    marginBottom: "16px",
  },
  positionNumber: {
    fontSize: "40px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
  positionLabel: { color: "#666", fontSize: "14px" },
  acknowledgeBox: {
    backgroundColor: "#fef9c3",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  acknowledgeText: {
    fontSize: "14px",
    color: "#854d0e",
    marginBottom: "10px",
  },
  acknowledgeBtn: {
    padding: "8px 16px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
  },
  acknowledgedMsg: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontWeight: "600",
  },
  withdrawBtn: {
    padding: "8px 16px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "16px",
  },
  logsTitle: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "10px",
    marginTop: "8px",
  },
  logsContainer: {
    borderLeft: "2px solid #e5e7eb",
    paddingLeft: "16px",
  },
  logItem: { marginBottom: "12px" },
  logAction: {
    fontWeight: "600",
    fontSize: "13px",
    color: "#4f46e5",
  },
  logDetails: { fontSize: "13px", color: "#555", marginTop: "2px" },
  logTime: { fontSize: "11px", color: "#999", marginTop: "2px" },
  applyCard: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  applyText: { color: "#666", marginBottom: "16px", fontSize: "15px" },
  applyBtn: {
    padding: "12px 32px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "16px",
  },
};

export default ApplicantDashboard;