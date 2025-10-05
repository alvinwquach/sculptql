import { Sparkles, FileText, Zap, Layers, Copy } from "lucide-react";

export default function QueryTemplatesSection() {
  return (
    <section
      id="query-templates"
      className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-900/80 to-purple-900/60 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-medium mb-6 border border-purple-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            Reusable Query Templates
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Save time with smart templates
            </span>
          </h2>
          <p className="text-xl text-pink-100 max-w-3xl mx-auto leading-relaxed">
            Create reusable SQL templates with dynamic parameters. Turn your
            most common queries into powerful, customizable templates.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-purple-900/30 rounded-2xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-300 mb-2">
                    Parameterized Queries
                  </h3>
                  <p className="text-pink-100 leading-relaxed">
                    Create templates with dynamic parameters that can be
                    customized on-the-fly. Perfect for reports that change
                    variables but keep the same structure.
                  </p>
                </div>
              </div>
            </div>
            <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-pink-900/30 rounded-2xl border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-pink-300 mb-2">
                    One-Click Execution
                  </h3>
                  <p className="text-pink-100 leading-relaxed">
                    Execute templates instantly with customizable parameters. No
                    need to rewrite complex queries from scratch every time.
                  </p>
                </div>
              </div>
            </div>
            <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-cyan-900/30 rounded-2xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Layers className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">
                    Organize & Tag
                  </h3>
                  <p className="text-pink-100 leading-relaxed">
                    Tag templates by project, database dialect, or use case.
                    Search and filter to find exactly what you need in seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-purple-300">
                      User Analytics Report
                    </h4>
                    <p className="text-xs text-gray-400">
                      Last updated 2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-purple-500/20 rounded-full text-xs font-medium text-purple-300 border border-purple-500/30">
                    PostgreSQL
                  </div>
                  <div className="px-3 py-1 bg-pink-500/20 rounded-full text-xs font-medium text-pink-300 border border-pink-500/30">
                    Analytics
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm mb-6">
                <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                  <div className="text-gray-400 text-xs mb-2">Parameters:</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">$startDate</span>
                      <span className="text-gray-500">=</span>
                      <span className="text-pink-300">
                        &apos;2024-01-01&apos;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">$minSignups</span>
                      <span className="text-gray-500">=</span>
                      <span className="text-cyan-300">100</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-gray-300">
                  <div>
                    <span className="text-pink-400 font-bold">SELECT</span>{" "}
                    country, <span className="text-cyan-400">COUNT</span>(*){" "}
                    <span className="text-pink-400 font-bold">AS</span> signups
                  </div>
                  <div>
                    <span className="text-pink-400 font-bold">FROM</span> users
                  </div>
                  <div>
                    <span className="text-pink-400 font-bold">WHERE</span>{" "}
                    created_at &gt;={" "}
                    <span className="text-purple-400">$startDate</span>
                  </div>
                  <div>
                    <span className="text-pink-400 font-bold">GROUP BY</span>{" "}
                    country
                  </div>
                  <div>
                    <span className="text-pink-400 font-bold">HAVING</span>{" "}
                    <span className="text-cyan-400">COUNT</span>(*) &gt;{" "}
                    <span className="text-purple-400">$minSignups</span>
                  </div>
                  <div>
                    <span className="text-pink-400 font-bold">ORDER BY</span>{" "}
                    signups{" "}
                    <span className="text-pink-400 font-bold">DESC</span>;
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Execute Template
                </button>
                <button className="px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-purple-300 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl border border-purple-500/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              ♾️
            </div>
            <div className="text-sm text-gray-400 mb-1">
              Unlimited Templates
            </div>
            <div className="text-xs text-pink-200">
              Create as many as you need
            </div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-pink-500/10 to-transparent rounded-2xl border border-pink-500/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              ⚡
            </div>
            <div className="text-sm text-gray-400 mb-1">Instant Execution</div>
            <div className="text-xs text-pink-200">
              Run queries in milliseconds
            </div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl border border-cyan-500/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              🏷️
            </div>
            <div className="text-sm text-gray-400 mb-1">Smart Organization</div>
            <div className="text-xs text-pink-200">
              Tag and categorize effortlessly
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
