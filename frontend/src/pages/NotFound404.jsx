export default function NotFound404() {
    return (
        <section className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-9xl font-extrabold tracking-widest text-white">404</h1>
            <div className="bg-[#FF6A3D] px-2 text-sm rounded rotate-12 absolute">
                Page Not Found
            </div>
            <div className="mt-8 text-center">
                <h3 className="text-2xl md:text-3xl font-semibold mb-4">Looks like you're lost</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">The page you are looking for is not available!</p>
                <a href="/" className="px-8 py-3 font-medium bg-white text-black rounded hover:bg-gray-200 transition-colors duration-200">Go to Home</a>
            </div>
        </section>
    );
}

