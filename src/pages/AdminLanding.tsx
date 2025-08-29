import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, FileText, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const AdminLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Shield className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Admin Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Manage applications, approve officers, and oversee the entire ID system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>ID Applications</CardTitle>
              <CardDescription>
                Review, approve, and manage all ID applications and renewals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full">
                <Link to="/admin">Access Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Officer Management</CardTitle>
              <CardDescription>
                Approve new officers and manage existing officer accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link to="/admin">Manage Officers</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="bg-card/50 rounded-lg p-8 max-w-2xl mx-auto">
            <Settings className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">System Administration</h2>
            <p className="text-muted-foreground mb-6">
              As an administrator, you have full control over the ID management system. 
              Monitor application processing, manage officer permissions, and ensure 
              the security and efficiency of the entire platform.
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

export default AdminLanding;