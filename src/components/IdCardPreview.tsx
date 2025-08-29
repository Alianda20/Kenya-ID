import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Printer, X } from 'lucide-react';

interface IdCardPreviewProps {
  applicationId: number;
  open: boolean;
  onClose: () => void;
  onPrint: () => void;
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
  generated_id_number: string;
  existing_id_number?: string;
  created_at: string;
  officer_name: string;
  documents?: Array<{
    document_type: string;
    file_path: string;
  }>;
}

const IdCardPreview = ({ applicationId, open, onClose, onPrint }: IdCardPreviewProps) => {
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
      console.log('Fetching application details for ID:', applicationId);
      const response = await fetch(`http://localhost:5000/api/admin/applications/${applicationId}`);
      const data = await response.json();
      
      console.log('API Response:', response.status, data);
      
      if (response.ok) {
        console.log('Application data received:', data.application);
        console.log('Available fields:', Object.keys(data.application || {}));
        console.log('Gender value:', data.application?.gender);
        console.log('District of birth:', data.application?.district_of_birth);
        console.log('Division:', data.application?.division);
        console.log('Location:', data.application?.location);
        setApplication(data.application);
      } else {
        console.error('API Error:', data.error);
        toast({
          title: "Error",
          description: data.error || "Failed to fetch application details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/applications/${applicationId}/print`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "ID Card Printed",
          description: "ID card has been sent to dispatch",
        });
        onPrint();
        onClose();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to print ID card",
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
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getPassportPhoto = () => {
    const passportDoc = application?.documents?.find(doc => doc.document_type === 'passport_photo');
    if (passportDoc) {
      let filePath = passportDoc.file_path;
      
      // Remove "uploads/" prefix if it exists to avoid double uploads path
      if (filePath.startsWith('uploads/')) {
        filePath = filePath.substring(8); // Remove "uploads/" 
      }
      
      // Now construct the proper URL with single uploads path
      return `http://localhost:5000/uploads/${filePath}`;
    }
    return null;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading ID card preview...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!application) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 font-semibold">Application not found</p>
              <p className="text-sm text-gray-600 mt-2">Unable to load application details</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              ID Card Preview - {application.application_number}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Front Side of ID Card */}
          <Card className="w-full max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🇰🇪</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">JAMHURI YA KENYA</h3>
                    <h4 className="font-bold text-xs text-gray-700">REPUBLIC OF KENYA</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600">SERIAL NUMBER:</p>
                  <p className="text-sm font-bold text-primary">{(application.generated_id_number || application.existing_id_number || '').substring(0, 8)}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">ID NUMBER:</p>
                  <p className="text-sm font-bold text-primary">{application.generated_id_number || application.existing_id_number || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">FULL NAME:</p>
                      <p className="text-sm font-bold text-gray-800 uppercase">{application.full_names || 'N/A'}</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">DATE OF BIRTH:</p>
                        <p className="text-sm font-bold text-gray-800">{application.date_of_birth ? formatDate(application.date_of_birth) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">SEX:</p>
                        <p className="text-sm font-bold text-gray-800 uppercase">{application.gender || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-600">DISTRICT OF BIRTH:</p>
                      <p className="text-sm font-bold text-gray-800 uppercase">{application.district_of_birth || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-600">PLACE OF BIRTH:</p>
                      <p className="text-sm font-bold text-gray-800 uppercase">{application.district_of_birth || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-600">DATE OF ISSUE:</p>
                      <p className="text-sm font-bold text-gray-800">{formatDate(new Date().toISOString())}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  {/* Passport Photo */}
                  <div className="w-24 h-32 bg-gray-200 border-2 border-gray-400 flex items-center justify-center overflow-hidden">
                    {getPassportPhoto() ? (
                      <img 
                        src={getPassportPhoto()!} 
                        alt="Passport Photo" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = '<span class="text-xs text-gray-500 text-center">PHOTO</span>';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-500 text-center">PHOTO</span>
                    )}
                  </div>
                  
                  {/* Thumbprint placeholder */}
                  <div className="w-16 h-20 bg-gray-300 border border-gray-400 flex items-center justify-center">
                    <span className="text-xs text-gray-500 transform rotate-90">THUMB</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-xs font-semibold text-gray-600">HOLDER'S SIGN:</p>
                  <div className="w-24 h-8 border-b border-gray-400 mt-1"></div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">COAT OF ARMS</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back Side of ID Card */}
          <Card className="w-full max-w-3xl mx-auto bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">DISTRICT:</p>
                    <p className="text-sm font-bold text-gray-800 uppercase">{application.home_district || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-600">DIVISION:</p>
                    <p className="text-sm font-bold text-gray-800 uppercase">{application.division || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-600">LOCATION:</p>
                    <p className="text-sm font-bold text-gray-800 uppercase">{application.location || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-600">SUB-LOCATION:</p>
                    <p className="text-sm font-bold text-gray-800 uppercase">{application.sub_location || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center">
                  <div className="w-20 h-20 bg-gray-200 border-2 border-gray-400 flex items-center justify-center mb-2 overflow-hidden">
                    {getPassportPhoto() ? (
                      <img 
                        src={getPassportPhoto()!} 
                        alt="Passport Photo" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = '<span class="text-xs text-gray-500 text-center">PHOTO</span>';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-500 text-center">PHOTO</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 text-center">DEPUTY</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">PRINCIPAL REGISTRAR'S SIGN:</p>
                    <div className="w-32 h-8 border-b border-gray-400 mt-1"></div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{application.generated_id_number || application.existing_id_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-mono text-gray-800 tracking-widest">
                    IDKYA{application.generated_id_number || application.existing_id_number || '00000000'}{'<'}<span className="text-red-600">4041</span>{'<'}{application.date_of_birth ? calculateAge(application.date_of_birth).toString().padStart(2, '0') : '00'}{'<'}<span className="text-red-600">4041</span>
                  </p>
                  <p className="text-xs font-mono text-gray-800 tracking-widest mt-1">
                    {application.date_of_birth ? formatDate(application.date_of_birth).replace(/\//g, '') : '00000000'}M{formatDate(new Date().toISOString()).replace(/\//g, '')}{'<'}B{(application.generated_id_number || application.existing_id_number || '00000000').substring(0, 8)}{'<'}2
                  </p>
                  <p className="text-xs font-mono text-gray-800 tracking-widest mt-1">
                    {(application.full_names || 'UNKNOWN').replace(/\s+/g, '<').toUpperCase()}{'<'.repeat(Math.max(0, 44 - (application.full_names || '').length))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print ID Card & Send to Dispatch
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IdCardPreview;