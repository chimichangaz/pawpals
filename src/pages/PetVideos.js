// src/pages/PetVideos.js
import React from "react";

const videoList = [
  {
    title: "How to take care of a puppy",
    description: "Learn the fundamentals of taking care of your dog with positive reinforcement techniques.",
    url: "https://www.youtube.com/watch?v=Ro0KH6hAnHA",
    category: "Training",
    duration: "6 min"
  },
  {
    title: "Puppy Potty Training - Complete Guide",
    description: "Step-by-step guide to house train your puppy quickly and effectively.",
    url: "https://www.youtube.com/watch?v=7vOXWCewEYM",
    category: "Training",
    duration: "10 min"
  },
  {
    title: "How to Stop Excessive Barking",
    description: "Proven techniques to reduce and control your dog's barking behavior.",
    url: "https://www.youtube.com/watch?v=1ln5lpH5Nf0",
    category: "Behavior",
    duration: "12 min"
  },
  {
    title: "Dog Grooming at Home - Complete Tutorial",
    description: "Professional grooming techniques you can do at home to keep your dog clean and healthy.",
    url: "https://www.youtube.com/watch?v=3GIbxJJMbCw",
    category: "Grooming",
    duration: "34 min"
  },
  {
    title: "First Aid for Dogs - Emergency Care",
    description: "Essential first aid skills every dog owner should know for emergency situations.",
    url: "https://www.youtube.com/watch?v=Yxtbvo2rFEA",
    category: "Health",
    duration: "1hr 5 min"
  },
  {
    title: "Leash Training Your Dog",
    description: "Master the art of loose leash walking with your dog using positive methods.",
    url: "https://www.youtube.com/watch?v=y2yj2xtCo-k",
    category: "Training",
    duration: "15 min"
  },
  {
    title: "Dog Nutrition - What to Feed Your Pet",
    description: "Complete guide to proper dog nutrition, portion sizes, and healthy feeding habits.",
    url: "https://www.youtube.com/watch?v=XIxGBQfZigw",
    category: "Health",
    duration: "8 min"
  },
  {
    title: "Teaching Your Dog to Come When Called",
    description: "Reliable recall training techniques to keep your dog safe and responsive.",
    url: "https://www.youtube.com/watch?v=rwldfBjFsdE",
    category: "Training",
    duration: "7 min"
  },
  {
    title: "Dog Exercise Ideas for Rainy Days",
    description: "Indoor activities and mental stimulation games to keep your dog active during monsoons.",
    url: "https://www.youtube.com/watch?v=Ui9GwQ6OatE",
    category: "Exercise",
    duration: "9 min"
  },
  {
    title: "Understanding Dog Body Language",
    description: "Learn to read your dog's signals and understand what they're trying to communicate.",
    url: "https://www.youtube.com/watch?v=siy0eog48ys",
    category: "Behavior",
    duration: "5 min"
  }
];



function PetVideos() {
  const handleVideoClick = (url) => {
    window.open(url, '_blank');
  };

  const videoCardStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s"
  };

  const videoCardHoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
  };

  const categoryBadgeStyle = {
    display: "inline-block",
    backgroundColor: "#ff7043",
    color: "white",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "500",
    marginRight: "10px"
  };

  const durationBadgeStyle = {
    display: "inline-block",
    backgroundColor: "#f0f0f0",
    color: "#666",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "500"
  };

  const videoTitleStyle = {
    color: "#333",
    fontSize: "1.3rem",
    fontWeight: "600",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

  const videoDescStyle = {
    color: "#666",
    lineHeight: "1.5",
    marginBottom: "15px"
  };

  const addMoreStyle = {
    border: "2px dashed #ddd",
    borderRadius: "8px",
    padding: "40px",
    textAlign: "center",
    color: "#999",
    fontSize: "1.1rem",
    marginTop: "20px"
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🎥 Pet Care Videos</h1>
        <p className="results-count">
          Helpful videos for dog owners in Bangalore - Training, health tips, and more!
        </p>
      </div>

      <div className="videos-grid">
        {videoList.map((video, index) => (
          <div
            key={index}
            style={videoCardStyle}
            onClick={() => handleVideoClick(video.url)}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, videoCardHoverStyle);
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
          >
            <div style={videoTitleStyle}>
              <span>▶️</span>
              {video.title}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <span style={categoryBadgeStyle}>{video.category}</span>
              <span style={durationBadgeStyle}>{video.duration}</span>
            </div>
            
            <p style={videoDescStyle}>{video.description}</p>
            
            <div style={{ 
              fontSize: "0.9rem", 
              color: "#ff7043", 
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}>
              <span>🔗</span>
              Click to watch on YouTube
            </div>
          </div>
        ))}

        <div style={addMoreStyle}>
          <p>📹 More videos coming soon!</p>
          <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>
            Have a great pet care video to recommend? Share it in our Forum!
          </p>
        </div>
      </div>
    </div>
  );
}

export default PetVideos;