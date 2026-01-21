"use client";

import SectionTitle from "@/components/ui/SectionTitle";
import { useState } from "react";

const benefits = [
    { icon: "🎯", title: "Priority Event Registration", description: "Get first access to workshops and competitions" },
    { icon: "🏆", title: "Competition Opportunities", description: "Represent CBIT in inter-college math events" },
    { icon: "📚", title: "Learning Resources", description: "Access exclusive study materials and problem sets" },
    { icon: "🤝", title: "Networking", description: "Connect with like-minded math enthusiasts" },
    { icon: "📜", title: "Certificates", description: "Earn certificates for participation and achievements" },
    { icon: "💼", title: "Leadership Roles", description: "Opportunity to join the core committee" },
];

export default function JoinPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rollNumber: "",
        branch: "",
        year: "",
        phone: "",
        interests: [],
        whyJoin: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Thank you for your application! We'll contact you soon with further details.");
        setFormData({
            name: "",
            email: "",
            rollNumber: "",
            branch: "",
            year: "",
            phone: "",
            interests: [],
            whyJoin: "",
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            if (checked) {
                setFormData({ ...formData, interests: [...formData.interests, value] });
            } else {
                setFormData({
                    ...formData,
                    interests: formData.interests.filter((i) => i !== value),
                });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    return (
        <div className="relative">
            {/* Hero */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Join <span className="text-gradient">RMC</span>
                    </h1>
                    <p className="text-xl text-muted">
                        Become part of CBIT's mathematical community
                    </p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Membership Benefits"
                        subtitle="What you get by joining RMC"
                        gradient={true}
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className={`card ${["card-teal", "card-lime", "card-coral", "card-orange"][index % 4]} p-6 text-center`}
                            >
                                <div className="text-4xl mb-3">{benefit.icon}</div>
                                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                                <p className="text-muted text-sm">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Eligibility */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card/50">
                <div className="max-w-4xl mx-auto">
                    <div className="card bg-gradient-primary text-white p-8 text-center">
                        <h2 className="text-2xl font-bold mb-4">Eligibility Criteria</h2>
                        <div className="grid sm:grid-cols-3 gap-6">
                            <div>
                                <div className="text-3xl mb-2">🎓</div>
                                <p>Current CBIT student</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">💡</div>
                                <p>Interest in mathematics</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">🤝</div>
                                <p>Willingness to participate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Registration Form */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <SectionTitle
                        title="Registration Form"
                        subtitle="Fill out the form below to apply"
                    />
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Roll Number *</label>
                                <input
                                    type="text"
                                    name="rollNumber"
                                    value={formData.rollNumber}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors"
                                    placeholder="e.g., 160123733001"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors"
                                    placeholder="your.email@cbit.ac.in"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors"
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Branch *</label>
                                <select
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors"
                                >
                                    <option value="">Select your branch</option>
                                    <option value="CSE">Computer Science & Engineering</option>
                                    <option value="ECE">Electronics & Communication</option>
                                    <option value="EEE">Electrical & Electronics</option>
                                    <option value="IT">Information Technology</option>
                                    <option value="MECH">Mechanical Engineering</option>
                                    <option value="CIVIL">Civil Engineering</option>
                                    <option value="AI-ML">AI & Machine Learning</option>
                                    <option value="AIDS">AI & Data Science</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Year *</label>
                                <select
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors"
                                >
                                    <option value="">Select your year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3">Areas of Interest</label>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    "Number Theory",
                                    "Algebra",
                                    "Geometry",
                                    "Calculus",
                                    "Probability & Statistics",
                                    "Cryptography",
                                    "Competitive Math",
                                    "Applied Mathematics",
                                ].map((interest) => (
                                    <label key={interest} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="interests"
                                            value={interest}
                                            checked={formData.interests.includes(interest)}
                                            onChange={handleChange}
                                            className="w-4 h-4 rounded border-muted/20 text-teal focus:ring-teal"
                                        />
                                        <span className="text-muted">{interest}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Why do you want to join RMC?</label>
                            <textarea
                                name="whyJoin"
                                value={formData.whyJoin}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-card border border-muted/20 focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-colors resize-none"
                                placeholder="Tell us about your interest in mathematics and what you hope to gain from RMC..."
                            />
                        </div>

                        <div className="card bg-card/80 p-4 text-sm text-muted">
                            <p>
                                📝 <strong>Note:</strong> Annual membership fee is ₹100, payable after your application is approved.
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary w-full text-lg py-4">
                            Submit Application →
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
