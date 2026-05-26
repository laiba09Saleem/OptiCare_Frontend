import { Link } from "react-router-dom";
import { Activity, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-brand/20">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-brand-glow/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[30%] w-[30%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center pt-20 pb-16">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 flex flex-col items-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-1 shadow-2xl ring-1 ring-black/5 dark:bg-black dark:ring-white/10">
            <div className="flex h-full w-full items-center justify-center rounded-[1.25rem]" style={{ background: "var(--gradient-brand)" }}>
              <Activity className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="max-w-4xl text-center text-5xl font-extrabold tracking-tight sm:text-7xl">
            Modern <span className="bg-gradient-to-r from-brand to-brand-glow bg-clip-text text-transparent">OptiCare</span> Management
          </h1>
          
          <p className="mt-8 max-w-2xl text-center text-xl text-muted-foreground leading-relaxed">
            A comprehensive, high-performance dashboard for modern healthcare. 
            Monitor patient vitals, manage bed allocations, and generate intelligent reports in real-time.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-8 text-base font-semibold shadow-elegant hover:shadow-brand/20 transition-all duration-300">
              <Link to="/login">
                Get Started Now
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold border-brand/20 hover:bg-brand/5">
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="mt-24 grid w-full max-w-6xl gap-8 md:grid-cols-3">
          {[
            { 
              icon: ShieldCheck, 
              title: "Enterprise Security", 
              desc: "Fully encrypted data transmission with multi-factor authentication and role-based access control.",
              color: "bg-blue-500/10 text-blue-500"
            },
            { 
              icon: Stethoscope, 
              title: "Clinical Precision", 
              desc: "Real-time vital sign monitoring with sub-second latency and intelligent abnormality detection.",
              color: "bg-emerald-500/10 text-emerald-500"
            },
            { 
              icon: Activity, 
              title: "Unified Workflow", 
              desc: "Seamless integration between patient tracking, daily reports, and healthcare provider communication.",
              color: "bg-purple-500/10 text-purple-500"
            },
          ].map((f, i) => (
            <div 
              key={f.title} 
              className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:bg-black/20"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${f.color}`}>
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{f.desc}</p>
              
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-brand/5 transition-all duration-500 group-hover:scale-150" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
