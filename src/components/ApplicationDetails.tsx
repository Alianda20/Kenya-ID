import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X, User, Calendar, MapPin, Phone, Mail, FileText, Image } from 'lucide-react';
import { generateWaitingCard } from '@/lib/pdfGenerator';

interface ApplicationDetailsProps {
  applicationId: number;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface Application {
  id: number;
  application_number: string;
  full_names: string;
  date_of_birth: string;
  gender: string;
  father_name: string;
  mother_name: string;
  marital_status: string;
  husband_name?: string;
  husband_id_no?: string;
  district_of_birth: string;
  tribe: string;
  clan?: string;
  family?: string;
  home_district: string;
  division: string;
  constituency: string;
  location: string;
  sub_location: string;
  village_estate: string;
  home_address?: string;
  occupation: string;
  application_type: string;
  status: string;
  generated_id_number?: string;
  created_at: string;
  officer_name: string;
  documents: Array<{
    document_type: string;
    file_path: string;
  }>;
}

const ApplicationDetails = ({ applicationId, open, onClose, onUpdate }: ApplicationDetailsProps) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && applicationId) {
      fetchApplicationDetails();
    }
  }, [open, applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/applications/${applicationId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Application data received:', data.application);
        setApplication(data.application);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch application details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/applications/${applicationId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Application Approved",
          description: `ID Number assigned: ${data.id_number}. Application moved to preview.`,
        });
        onUpdate();
        onClose();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve application",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/applications/${applicationId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Application Rejected",
          description: "Application has been rejected",
        });
        onUpdate();
        onClose();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject application",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading application details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!application) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">Application not found</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              Application Details - {application.application_number}
            </div>
            <Badge className={getStatusColor(application.status)}>
              {application.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Names</label>
                <p className="font-medium">{application.full_names}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="font-medium">{formatDate(application.date_of_birth)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="font-medium capitalize">{application.gender || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Occupation</label>
                <p className="font-medium">{application.occupation || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                <p className="font-medium">{application.father_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mother's Name</label>
                <p className="font-medium">{application.mother_name}</p>
              </div>
              {application.marital_status === 'married' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Husband's Name</label>
                    <p className="font-medium">{application.husband_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Husband's ID No.</label>
                    <p className="font-medium">{application.husband_id_no}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">District of Birth</label>
                <p className="font-medium">{application.district_of_birth || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tribe</label>
                <p className="font-medium">{application.tribe || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Home District</label>
                <p className="font-medium">{application.home_district || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Division</label>
                <p className="font-medium">{application.division || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Constituency</label>
                <p className="font-medium">{application.constituency || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="font-medium">{application.location || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sub-Location</label>
                <p className="font-medium">{application.sub_location || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Village/Estate</label>
                <p className="font-medium">{application.village_estate || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {application.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{doc.file_path.split('/').pop()}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`http://localhost:5000/${doc.file_path}`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Application Type</label>
                <p className="font-medium capitalize">{application.application_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Processing Officer</label>
                <p className="font-medium">{application.officer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Application Date</label>
                <p className="font-medium">{formatDate(application.created_at)}</p>
              </div>
              {application.generated_id_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Number</label>
                  <p className="font-medium text-primary">{application.generated_id_number}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {application.status === 'submitted' && (
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Application
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Application
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetails;