import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, ArrowLeft, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const TrackApplication = () => {
  const [waitingCardNumber, setWaitingCardNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!waitingCardNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a waiting card number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/applications/track/${waitingCardNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        setApplicationStatus({
          applicationNumber: data.application.application_number,
          firstName: data.application.full_names.split(' ')[0],
          lastName: data.application.full_names.split(' ').slice(1).join(' '),
          applicationType: data.application.application_type,
          applicationDate: data.application.created_at,
          status: data.application.status
        });
      } else if (response.status === 404) {
        toast({
          title: "Not Found",
          description: "No application found with this waiting card number",
          variant: "destructive",
        });
        setApplicationStatus(null);
      } else {
        throw new Error("Failed to fetch application status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch application status. Please try again.",
        variant: "destructive",
      });
      setApplicationStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "ready_for_dispatch":
        return <CheckCircle className="h-6 w-6 text-orange-500" />;
      case "dispatched":
        return <CheckCircle className="h-6 w-6 text-purple-500" />;
      case "ready_for_collection":
        return <CheckCircle className="h-6 w-6 text-blue-500" />;
      case "collected":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case "submitted":
        return <Clock className="h-6 w-6 text-blue-500" />;
      default:
        return <FileText className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      case "ready_for_dispatch":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "dispatched":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "ready_for_collection":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "collected":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "submitted":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Track Your Application
            </h1>
            <p className="text-muted-foreground">
              Enter your waiting card number to check your application status
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Application Tracker
              </CardTitle>
              <CardDescription>
                Enter the waiting card number you received when you submitted your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waitingCard">Waiting Card Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="waitingCard"
                    type="text"
                    placeholder="Enter your waiting card number"
                    value={waitingCardNumber}
                    onChange={(e) => setWaitingCardNumber(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {applicationStatus && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Application Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Applicant Name
                        </Label>
                        <p className="text-foreground font-medium">
                          {applicationStatus.firstName} {applicationStatus.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Application Type
                        </Label>
                        <p className="text-foreground font-medium capitalize">
                          {applicationStatus.applicationType === 'renewal' ? 'Renewal' : 'New'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Application Date
                        </Label>
                        <p className="text-foreground font-medium">
                          {new Date(applicationStatus.applicationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Current Status
                        </Label>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(applicationStatus.status || 'submitted')}`}>
                          {getStatusIcon(applicationStatus.status || 'submitted')}
                          <span className="capitalize">{applicationStatus.status?.replace('_', ' ') || 'Submitted'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {applicationStatus.status === "approved" && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">
                          🎉 Congratulations! Your application has been approved.
                        </p>
                        <p className="text-green-700 text-sm mt-1">
                          Your ID card will be dispatched soon.
                        </p>
                      </div>
                    )}
                    
                    {applicationStatus.status === "rejected" && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-medium">
                          ❌ Your application has been rejected.
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          Please contact the issuing office for more information.
                        </p>
                      </div>
                    )}
                    
                    {applicationStatus.status === "ready_for_dispatch" && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg shadow-sm">
                        <p className="text-orange-800 font-medium flex items-center gap-2">
                          📋 Ready for dispatch
                        </p>
                        <p className="text-orange-700 text-sm mt-1">
                          Your ID card has been processed and is ready for dispatch. It will be sent out shortly.
                        </p>
                        <div className="mt-3 p-3 bg-white/70 rounded-md border border-orange-100">
                          <p className="text-orange-800 text-sm font-medium">📦 Next Step:</p>
                          <p className="text-orange-600 text-xs mt-1">Your ID card will be dispatched to the collection center soon</p>
                        </div>
                      </div>
                    )}
                    
                    {applicationStatus.status === "dispatched" && (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-purple-800 font-medium">
                          📦 Your ID has been dispatched!
                        </p>
                        <p className="text-purple-700 text-sm mt-1">
                          Your ID card has been printed and dispatched. You should receive it soon.
                        </p>
                      </div>
                    )}
                    
                    {applicationStatus.status === "pending" && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium">
                          ⏳ Your application is currently being processed.
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                          Please check back later for updates.
                        </p>
                      </div>
                    )}
                    
                    {(applicationStatus.status === "submitted" || !applicationStatus.status || applicationStatus.status.trim() === "") && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 font-medium">
                          📝 Your application has been submitted.
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          Your application is awaiting admin review and approval.
                        </p>
                      </div>
                    )}
                    
                    {applicationStatus.status === "ready_for_collection" && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg shadow-sm">
                        <p className="text-blue-800 font-medium flex items-center gap-2">
                          🎉 Your ID card has arrived at the station!
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          Please visit the issuing station to collect your ID card with your waiting card.
                        </p>
                        <div className="mt-3 p-3 bg-white/70 rounded-md border border-blue-100">
                          <p className="text-blue-800 text-sm font-medium">📍 Collection Instructions:</p>
                          <p className="text-blue-600 text-xs mt-1">Bring your waiting card and a valid form of identification</p>
                        </div>
                      </div>
                    )}
                    
                    {applicationStatus.status === "collected" && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
                        <p className="text-green-800 font-medium flex items-center gap-2">
                          ✅ Congratulations! Your ID card has been successfully collected!
                        </p>
                        <p className="text-green-700 text-sm mt-1">
                          Thank you for using our digital ID management system.
                        </p>
                        <div className="mt-3 p-3 bg-white/70 rounded-md border border-green-100">
                          <p className="text-green-800 text-sm font-medium">🎊 Process Complete:</p>
                          <p className="text-green-600 text-xs mt-1">Your ID application journey is now complete. Keep your ID safe!</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrackApplication;
