import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const PublicLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-tertiary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Search className="h-20 w-20 text-tertiary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Track Your Application
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Check the status of your ID application using your waiting card number
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-12 w-12 text-tertiary mx-auto mb-4" />
              <CardTitle>Application Status</CardTitle>
              <CardDescription>
                Enter your waiting card number to check current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="tertiary" className="w-full">
                <Link to="/track">Check Status</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Processing Times</CardTitle>
              <CardDescription>
                View typical processing times for different application types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/track">View Times</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Collection Notice</CardTitle>
              <CardDescription>
                Get notified when your ID is ready for collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link to="/track">Check Collection</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="bg-card/50 rounded-lg p-8 max-w-2xl mx-auto">
            <Search className="h-16 w-16 text-tertiary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">How to Track</h2>
            <p className="text-muted-foreground mb-6">
              Use the waiting card number provided during your application submission 
              to track your ID processing status. You'll receive real-time updates 
              on your application's progress through our secure tracking system.
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

export default PublicLanding;