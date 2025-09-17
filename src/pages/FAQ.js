// src/pages/FAQ.js
import React, { useState } from "react";

const faqs = [
  {
    question: "What is PawPals?",
    answer:
      "PawPals is a community platform for pet owners in Bangalore. You can browse pets, join the forum, attend meetups, and discover trusted veterinary clinics.",
  },
  {
    question: "Who can use the forum?",
    answer:
      "Right now, the forum is focused on dog owners in Bangalore, but it will expand to include other pets and regions soon.",
  },
  {
    question: "How do I join a meetup?",
    answer:
      "Check out the Events page for upcoming dog meetups. Each event has details, timing, and venue information. You can RSVP directly.",
  },
  {
    question: "Can I recommend my vet clinic?",
    answer:
      "Yes! If you know a great vet clinic in Bangalore, please share it in the Forum under the 'Vet Clinics' category. We'll keep updating the Clinics map.",
  },
  {
    question: "Is PawPals free to use?",
    answer:
      "Yes, PawPals is completely free for dog owners. Some premium features (like priority listings) may be added in the future.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">❓ Frequently Asked Questions</h1>
        <p className="results-count">
          Common questions from Bangalore dog owners using PawPals
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${openIndex === index ? "open" : ""}`}
            onClick={() => toggleFAQ(index)}
            style={{
              borderBottom: "1px solid #ddd",
              padding: "15px 0",
              cursor: "pointer",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{faq.question}</h3>
            {openIndex === index && (
              <p style={{ marginTop: "10px", color: "#f8e4e4ff" }}>{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQ;
