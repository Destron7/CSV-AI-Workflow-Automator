import React from 'react';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
            {/* Removed Header section as per your request */}

            {/* Hero Section */}
            <section className="bg-white py-20 text-center shadow-md rounded-lg mx-4 mt-8">
                <div className="container mx-auto px-6">
                    <h2 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Automate Your Data & Analytics with AI
                    </h2>
                    <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                        The AI Workflow Automator is a web-based platform designed to simplify complex data and analytics tasks using the power of Artificial Intelligence. Upload your CSV, configure your workflow, and get insights in minutes!
                    </p>
                    <a href="/app.html" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 shadow-lg">
                        Get Started Now
                    </a>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Key Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {/* Feature Card 1: Data Upload & Workflow */}
                        <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Effortless Data Upload & Workflow Configuration</h3>
                            <p className="text-gray-600 mb-4">
                                Upload your CSV files effortlessly, whether it's sales data, customer information, or any other dataset. Our intuitive form-based interface allows you to select from various tasks like data cleaning and causal analysis, and choose your desired output type – a dashboard or a detailed report.
                            </p>
                            <p className="text-sm text-gray-500">
                                Example: Analyze what drives sales by uploading sales data and configuring a causal analysis workflow.
                            </p>
                        </div>

                        {/* Feature Card 2: Data Cleaning */}
                        <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Automated Data Cleaning</h3>
                            <p className="text-gray-600 mb-4">
                                Say goodbye to manual data preparation. Our platform automatically handles missing values and ensures numerical columns are correctly formatted. Get a clear overview of your cleaned dataset's shape (rows and columns) in the results.
                            </p>
                        </div>

                        {/* Feature Card 3: Causal Analysis */}
                        <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">AI-Powered Causal Analysis</h3>
                            <p className="text-gray-600 mb-4">
                                Uncover true cause-and-effect relationships within your data using advanced AI techniques. Understand if advertising genuinely causes higher sales, or what truly impacts your key metrics. The results display causal effect values and the variables analyzed.
                            </p>
                        </div>

                        {/* Feature Card 4: No-Code Interface */}
                        <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Intuitive No-Code Interface</h3>
                            <p className="text-gray-600 mb-4">
                                Designed for everyone, our simple, user-friendly form allows even non-technical users to configure complex workflows without writing a single line of code.
                            </p>
                        </div>

                        {/* Feature Card 5: Results Visualization */}
                        <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Clear Results & Visualization</h3>
                            <p className="text-gray-600 mb-4">
                                View your insights in a clear dashboard format, with options for JSON output or basic charts. The platform also provides helpful error messages if something goes wrong.
                            </p>
                        </div>

                        {/* Feature Card 6: Extendable (Forecasting & Simulation) */}
                        <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Future-Ready: Forecasting & Simulation</h3>
                            <p className="text-gray-600">
                                While currently in development, our platform is designed to incorporate advanced features like time-series forecasting to predict future values and simulation capabilities for "what-if" scenario analysis.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-blue-700 text-white shadow-inner">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-8">About This Project</h2>
                    <p className="text-lg leading-relaxed max-w-3xl mx-auto">
                        The AI Workflow Automator is an internship project aimed at providing hands-on experience in web development, API design, and AI concepts. It's built using a modern tech stack including React for the frontend, FastAPI for a robust backend, and powerful Python libraries like Pandas and DoWhy for data processing and causal analysis. This project serves as a functional prototype, demonstrating the exciting possibilities of automating data tasks with AI.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8 mt-auto rounded-t-xl">
                <div className="container mx-auto text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} AI Workflow Automator Project. All rights reserved.</p>
                    <p className="mt-2">Built with ❤️ during an internship.</p>
                </div>
            </footer>
        </div>
    );
}
