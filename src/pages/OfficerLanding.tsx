import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UserPlus, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const OfficerLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Users className="h-20 w-20 text-secondary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Application Officer Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Process new applications, renewals, and manage ID collections efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <UserPlus className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>New Applications</CardTitle>
              <CardDescription>
                Process first-time ID applications and collect required documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link to="/officer">Start Processing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Renewals</CardTitle>
              <CardDescription>
                Handle ID renewal applications and verify existing documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full">
                <Link to="/officer">Process Renewals</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-tertiary mx-auto mb-4" />
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                Review and verify applications waiting for officer approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="tertiary" className="w-full">
                <Link to="/officer">View Pending</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="bg-card/50 rounded-lg p-8 max-w-2xl mx-auto">
            <Users className="h-16 w-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Officer Responsibilities</h2>
            <p className="text-muted-foreground mb-6">
              As an application officer, you are responsible for the initial processing 
              of ID applications. Verify documents, collect biometric data, and ensure 
              all requirements are met before forwarding applications for final approval.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to Main Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerLanding;