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

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleFAQ = (index) => setOpenIndex(openIndex === index ? null : index);

  const heroImg =
    "https://cdn.builder.io/api/v1/image/assets%2F720f9bd9b6b54adcb9360f64c8dfc2e3%2F6f10021c5bb1458f99d5115f9098ac77?format=webp&width=1200";

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-100">
          {/* decorative backdrop */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={heroImg}
              alt="decorative"
              className="w-full h-full object-cover opacity-10"
              style={{ filter: "grayscale(20%) blur(6px) brightness(0.9)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
          </div>

          <div className="relative z-10 p-10">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-4 justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-white text-2xl shadow-inner ring-1 ring-amber-200">🐾</div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Frequently Asked</h1>
                  <p className="mt-2 text-gray-600">Comfort, care and community — all for your pet.</p>
                </div>
              </div>

              <div className="mb-6 flex justify-center">
                <a href="#contact-email" className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold shadow-lg ring-1 ring-amber-100 hover:scale-105 transition-transform">Contact Support</a>
              </div>

              <div className="space-y-4 text-left">
                {faqs.map((faq, i) => {
                  const open = openIndex === i;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all ${open ? "ring-2 ring-rose-200" : "hover:shadow-md"}`}
                    >
                      <button
                        onClick={() => toggleFAQ(i)}
                        className="w-full text-left flex items-center justify-between px-6 py-4"
                        aria-expanded={open}
                      >
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{faq.question}</div>
                        </div>

                        <div className={`flex items-center justify-center rounded-full w-9 h-9 transition-transform ${open ? "bg-rose-600 text-white rotate-45" : "bg-gray-50 text-gray-500"}`}>
                          <svg viewBox="0 0 24 24" width="18" height="18" className="stroke-current">
                            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </div>
                      </button>

                      <div className={`px-6 pb-6 transition-all ${open ? "block" : "hidden"}`}>
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div id="contact-email" className="mt-8 text-center text-sm text-gray-500">
          Still have questions? Email us at <a href="mailto:pawpals@gmail.com" className="text-rose-600 underline">pawpals@gmail.com</a>
        </div>
      </div>
    </div>
  );
}