import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCompanyJobs,
  createJob,
  getJobById,
  closeJob,
  rejectApplicant,
  hireApplicant,
} from "../api";

function CompanyDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activeCapacity: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "company") {
      navigate("/login");
      return;
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getCompanyJobs();
      setJobs(res.data.jobs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPipeline = async (jobId) => {
    try {
      const res = await getJobById(jobId);
      setSelectedJob(res.data.job);
      setPipeline(res.data.pipeline);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createJob({
        ...formData,
        activeCapacity: parseInt(formData.activeCapacity),
      });
      setMessage("✅ Job created successfully!");
      setShowCreateForm(false);
      setFormData({ title: "", description: "", activeCapacity: "" });
      fetchJobs();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create job");
    }
    setLoading(false);
  };

  const handleCloseJob = async (jobId) => {
    try {
      await closeJob(jobId);
      setMessage("✅ Job closed successfully!");
      fetchJobs();
      setSelectedJob(null);
      setPipeline(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to close job");
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await rejectApplicant(applicationId);
      setMessage("Applicant rejected!");
      fetchPipeline(selectedJob._id);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reject");
    }
  };

  const handleHire = async (applicationId) => {
    try {
      await hireApplicant(applicationId);
      setMessage("🎉 Applicant hired!");
      fetchPipeline(selectedJob._id);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to hire");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
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
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>My Jobs</h2>
            <button
              style={styles.createBtn}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              + New Job
            </button>
          </div>

          {/* Create Job Form */}
          {showCreateForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>Create New Job</h3>
              <form onSubmit={handleCreateJob}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Job Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
                <textarea
                  style={{ ...styles.input, height: "80px", resize: "none" }}
                  placeholder="Job Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="Active Capacity (e.g. 3)"
                  value={formData.activeCapacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activeCapacity: e.target.value,
                    })
                  }
                  required
                  min="1"
                />
                <button
                  style={styles.submitBtn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Job"}
                </button>
              </form>
            </div>
          )}

          {/* Message */}
          {message && (
            <div style={styles.message} onClick={() => setMessage("")}>
              {message}
            </div>
          )}

          {/* Jobs List */}
          {jobs.length === 0 ? (
            <div style={styles.emptyState}>
              No jobs yet. Create your first job!
            </div>
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
                onClick={() => fetchPipeline(job._id)}
              >
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <div style={styles.jobMeta}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: job.isOpen ? "#dcfce7" : "#fee2e2",
                    color: job.isOpen ? "#16a34a" : "#dc2626",
                  }}>
                    {job.isOpen ? "Open" : "Closed"}
                  </span>
                  <span style={styles.capacity}>
                    Capacity: {job.activeCapacity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel - Pipeline */}
        <div style={styles.rightPanel}>
          {!selectedJob ? (
            <div style={styles.emptyPipeline}>
              <h2>👈 Select a job to view pipeline</h2>
              <p>Click on any job from the left panel</p>
            </div>
          ) : (
            <>
              <div style={styles.pipelineHeader}>
                <div>
                  <h2 style={styles.pipelineTitle}>{selectedJob.title}</h2>
                  <p style={styles.pipelineDesc}>{selectedJob.description}</p>
                </div>
                {selectedJob.isOpen && (
                  <button
                    style={styles.closeJobBtn}
                    onClick={() => handleCloseJob(selectedJob._id)}
                  >
                    Close Job
                  </button>
                )}
              </div>

              {/* Pipeline Stats */}
              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{pipeline?.activeCount}</div>
                  <div style={styles.statLabel}>Active</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{pipeline?.waitlistCount}</div>
                  <div style={styles.statLabel}>Waitlisted</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{pipeline?.availableSlots}</div>
                  <div style={styles.statLabel}>Available Slots</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{pipeline?.activeCapacity}</div>
                  <div style={styles.statLabel}>Total Capacity</div>
                </div>
              </div>

              {/* Active Applicants */}
              <h3 style={styles.sectionTitle}>🟢 Active Applicants</h3>
              {pipeline?.activeApplicants?.length === 0 ? (
                <div style={styles.emptyState}>No active applicants</div>
              ) : (
                pipeline?.activeApplicants?.map((app) => (
                  <div key={app._id} style={styles.applicantCard}>
                    <div>
                      <div style={styles.applicantName}>
                        {app.applicant?.name}
                      </div>
                      <div style={styles.applicantEmail}>
                        {app.applicant?.email}
                      </div>
                    </div>
                    <div style={styles.actionBtns}>
                      <button
                        style={styles.hireBtn}
                        onClick={() => handleHire(app._id)}
                      >
                        Hire
                      </button>
                      <button
                        style={styles.rejectBtn}
                        onClick={() => handleReject(app._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Waitlisted Applicants */}
              <h3 style={styles.sectionTitle}>⏳ Waitlisted Applicants</h3>
              {pipeline?.waitlistedApplicants?.length === 0 ? (
                <div style={styles.emptyState}>No waitlisted applicants</div>
              ) : (
                pipeline?.waitlistedApplicants?.map((app) => (
                  <div key={app._id} style={styles.applicantCard}>
                    <div>
                      <div style={styles.applicantName}>
                        {app.applicant?.name}
                      </div>
                      <div style={styles.applicantEmail}>
                        {app.applicant?.email}
                      </div>
                    </div>
                    <div style={styles.positionBadge}>
                      #{app.waitlistPosition}
                    </div>
                  </div>
                ))
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
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  panelTitle: { fontSize: "18px", fontWeight: "bold" },
  createBtn: {
    padding: "8px 12px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "#f9fafb",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  formTitle: { marginBottom: "12px", fontSize: "16px", fontWeight: "600" },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    marginBottom: "10px",
    outline: "none",
  },
  submitBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
  },
  message: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "12px",
    fontSize: "14px",
    cursor: "pointer",
  },
  jobCard: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginBottom: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  jobTitle: { fontSize: "15px", fontWeight: "600", marginBottom: "6px" },
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
  pipelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  pipelineTitle: { fontSize: "22px", fontWeight: "bold" },
  pipelineDesc: { color: "#666", fontSize: "14px", marginTop: "4px" },
  closeJobBtn: {
    padding: "8px 16px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
  },
  statsRow: { display: "flex", gap: "16px", marginBottom: "24px" },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  statNumber: { fontSize: "28px", fontWeight: "bold", color: "#4f46e5" },
  statLabel: { fontSize: "12px", color: "#666", marginTop: "4px" },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    marginTop: "8px",
  },
  applicantCard: {
    backgroundColor: "white",
    padding: "14px 18px",
    borderRadius: "8px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  applicantName: { fontWeight: "600", fontSize: "15px" },
  applicantEmail: { color: "#666", fontSize: "13px", marginTop: "2px" },
  actionBtns: { display: "flex", gap: "8px" },
  hireBtn: {
    padding: "6px 14px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "13px",
  },
  rejectBtn: {
    padding: "6px 14px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "13px",
  },
  positionBadge: {
    backgroundColor: "#f0f2f5",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
};

export default CompanyDashboard;