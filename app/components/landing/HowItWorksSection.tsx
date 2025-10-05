export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-900/80 to-purple-900/60"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How it works
          </h2>
          <p className="text-xl text-pink-100 max-w-3xl mx-auto">
            Get started with SculptQL in three simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/30">
              <span className="text-2xl font-bold text-pink-400">1</span>
            </div>
            <h3 className="text-xl font-semibold text-pink-400 mb-4">
              Install & Connect
            </h3>
            <p className="text-pink-100">
              Install SculptQL via npm and connect to your database with
              environment variables.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/30">
              <span className="text-2xl font-bold text-pink-400">2</span>
            </div>
            <h3 className="text-xl font-semibold text-pink-400 mb-4">
              Build Queries
            </h3>
            <p className="text-pink-100">
              Use our intuitive interface with intelligent autocomplete to build
              complex SQL queries.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/30">
              <span className="text-2xl font-bold text-pink-400">3</span>
            </div>
            <h3 className="text-xl font-semibold text-pink-400 mb-4">
              Explore & Visualize
            </h3>
            <p className="text-pink-100">
              Explore your schema, visualize relationships, and export results
              to multiple formats.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
