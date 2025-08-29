import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Home, FileText, CreditCard } from "lucide-react";
import { generateWaitingCard } from "@/lib/pdfGenerator";

interface LocationState {
  applicationNumber: string;
  applicationId: number;
  waitingCardNumber: string;
  paymentId: number;
  paymentMethod: string;
  amount: number;
  fullName: string;
}

const LostIdConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    if (!state?.applicationNumber) {
      navigate('/officer/dashboard');
      return;
    }
    
    // Debug logging to see what's in the state
    console.log('LostIdConfirmation - Full state received:', state);
    console.log('LostIdConfirmation - fullName from state:', state.fullName);
    
    // Generate waiting card after payment completion
    const generateCard = async () => {
      try {
        const officerData = JSON.parse(localStorage.getItem('officerData') || '{}');
        console.log('Officer data from localStorage:', officerData);
        
        const waitingCardData = {
          applicationNumber: String(state.applicationNumber || ''),
          fullName: state.fullName || 'Lost ID Replacement Applicant',
          district: officerData.constituency || 'Unknown District',
          applicationType: 'Lost ID Replacement',
          officerName: String(officerData?.fullName || officerData?.full_name || 'Registration Officer'),
          date: new Date().toLocaleDateString()
        };
        
        console.log('Waiting card data being generated:', waitingCardData);
        
        await generateWaitingCard(waitingCardData);
      } catch (error) {
        console.error('Failed to generate waiting card:', error);
      }
    };
    
    generateCard();
  }, [state, navigate]);

  if (!state) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Application Submitted Successfully!</h1>
            <p className="text-muted-foreground">
              Your lost ID replacement application has been submitted for admin approval
            </p>
          </div>

          {/* Application Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Application Number</label>
                  <p className="font-mono text-lg">{state.applicationNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Waiting Card Number</label>
                  <p className="font-mono text-lg">{state.waitingCardNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Application Type</label>
                  <Badge variant="secondary">Lost ID Replacement</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <Badge variant="outline">Submitted for Approval</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="capitalize">{state.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                  <p className="font-medium">KES {state.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                  <Badge variant="secondary">Pending Verification</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment ID</label>
                  <p className="font-mono">PAY{state.paymentId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
              <CardDescription>Follow these steps to track your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Admin Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Admin will review your application and verify payment within 1-2 business days
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Card Production</h4>
                    <p className="text-sm text-muted-foreground">
                      Once approved, your replacement ID will be produced and dispatched
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Collection</h4>
                    <p className="text-sm text-muted-foreground">
                      You'll be notified when your ID is ready for collection at the station
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/officer/dashboard')}
              className="flex items-center gap-2"
              size="lg"
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Important Notes */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">Important Notes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep your waiting card number safe for tracking purposes</li>
                <li>• SMS notifications will be sent for status updates</li>
                <li>• Bring original documents when collecting your new ID</li>
                <li>• Contact the station if you have any questions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LostIdConfirmation;