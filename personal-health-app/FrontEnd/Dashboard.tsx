import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ChatBot from "@/components/ChatBot";

interface HealthMetric {
  name: string;
  value: string;
  unit: string;
  normal: boolean;
  range: string;
}

const Dashboard = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [diagnosis, setDiagnosis] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    toast.info("Analyzing your report...");

    // Simulate OCR + AI analysis
    setTimeout(() => {
      setMetrics([
        { name: "Hemoglobin", value: "11.2", unit: "g/dL", normal: false, range: "12-16 g/dL" },
        { name: "Cholesterol", value: "245", unit: "mg/dL", normal: false, range: "< 200 mg/dL" },
        { name: "Blood Sugar", value: "98", unit: "mg/dL", normal: true, range: "70-100 mg/dL" },
        { name: "Platelets", value: "250", unit: "K/µL", normal: true, range: "150-400 K/µL" },
      ]);
      
      setDiagnosis(
        "Based on your lab results, you appear to have mild anemia (low hemoglobin) and elevated cholesterol. " +
        "These conditions are common and manageable. Low hemoglobin may cause fatigue and weakness. " +
        "High cholesterol increases cardiovascular risk.\n\n" +
        "**Recommendations:**\n" +
        "- Include iron-rich foods (spinach, lentils, red meat)\n" +
        "- Reduce saturated fats and increase fiber intake\n" +
        "- Consider vitamin supplements after consulting with your doctor\n" +
        "- Regular exercise and hydration are important"
      );
      
      setAnalyzed(true);
      setAnalyzing(false);
      toast.success("Analysis complete!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            AI-Powered Health Management Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload reports, get instant AI insights, set reminders, and connect with nearby doctors — all in one place.
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-card hover-scale cursor-pointer" onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Upload & Analyze Reports</CardTitle>
              <CardDescription>
                Upload your lab reports and get instant AI-powered diagnosis with health value extraction
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card hover-scale cursor-pointer" onClick={() => window.location.href = '/reminders'}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Diet Tips & Reminders</CardTitle>
              <CardDescription>
                Get personalized dietary recommendations and set smart medicine reminders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card hover-scale cursor-pointer" onClick={() => window.location.href = '/doctors'}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Doctors & Medicines</CardTitle>
              <CardDescription>
                Find nearby doctors and order medicines with just a few clicks
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Upload Section */}
        <div id="upload-section" className="scroll-mt-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Upload Lab Report</h2>
            <p className="text-muted-foreground">Upload your lab reports for AI-powered analysis</p>
          </div>

          {!analyzed ? (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Upload Lab Report</CardTitle>
              <CardDescription>Upload PDF or image files of your medical reports</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-sm text-foreground font-medium">Analyzing your report...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mb-4 text-primary" />
                      <p className="mb-2 text-sm text-foreground font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 10MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={analyzing}
                />
              </label>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Extracted Health Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.map((metric, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        metric.normal
                          ? "bg-success/5 border-success/20"
                          : "bg-destructive/5 border-destructive/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">{metric.name}</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metric.value} <span className="text-sm text-muted-foreground">{metric.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Normal: {metric.range}</p>
                        </div>
                        {!metric.normal && (
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle>AI Diagnosis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {diagnosis.split('\n').map((line, i) => (
                    <p key={i} className="text-foreground mb-2 whitespace-pre-wrap">{line}</p>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => window.location.href = '/medicines'}>
                    View Medicine Recommendations
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/doctors'}>
                    Find Doctors
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={() => setAnalyzed(false)}>
              Upload Another Report
            </Button>
          </div>
        )}
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default Dashboard;
