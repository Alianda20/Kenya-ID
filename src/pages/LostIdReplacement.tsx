import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Upload, User, FileText, AlertCircle } from "lucide-react";
import { generateWaitingCard } from "@/lib/pdfGenerator";

interface LostIdDetails {
  id: number;
  full_names: string;
  date_of_birth: string;
  generated_id_number: string;
  status: string;
  father_name: string;
  mother_name: string;
  home_district: string;
  gender: string;
  district_of_birth: string;
  division: string;
  location: string;
  sub_location: string;
  tribe: string;
  village_estate: string;
  marital_status: string;
  occupation: string;
}

const LostIdReplacement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchIdNumber, setSearchIdNumber] = useState("");
  const [idDetails, setIdDetails] = useState<LostIdDetails | null>(null);
  const [obNumber, setObNumber] = useState("");
  const [constituency, setConstituency] = useState("");
  const [constituencies, setConstituencies] = useState<{id: number; name: string}[]>([]);
  const [obPhoto, setObPhoto] = useState<File | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/constituencies');
        const data = await res.json();
        if (res.ok) setConstituencies(data.constituencies || []);
      } catch (e) {
        console.error('Failed to load constituencies', e);
      }
    };
    fetchConstituencies();
  }, []);

  const handleSearchId = async () => {
    if (!searchIdNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an ID number to search",
        variant: "destructive"
      });
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`http://localhost:5000/api/applications/search-by-id/${searchIdNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        setIdDetails(data.application);
        toast({
          title: "ID Found",
          description: "ID details retrieved successfully"
        });
      } else {
        setIdDetails(null);
        toast({
          title: "Not Found",
          description: "No ID found with this number",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for ID",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleFileChange = (file: File | null, setter: (file: File | null) => void) => {
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    setter(file);
  };

  const handleSubmitLostIdApplication = async () => {
    if (!idDetails || !obNumber.trim() || !constituency || !obPhoto || !passportPhoto || !birthCertificate) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields, select constituency, and upload all required documents",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('existing_id_number', idDetails.generated_id_number);
      formData.append('ob_number', obNumber);
      formData.append('renewal_reason', 'lost');
      formData.append('application_type', 'renewal');
      
      // Include all existing data from the original ID
      formData.append('full_names', idDetails.full_names);
      
      // Handle date_of_birth - ensure it's in YYYY-MM-DD format for backend
      if (idDetails.date_of_birth && idDetails.date_of_birth !== '0000-00-00' && !idDetails.date_of_birth.includes('null')) {
        console.log('Original date_of_birth:', idDetails.date_of_birth);
        let formattedDate = idDetails.date_of_birth;
        
        // If the date is already in YYYY-MM-DD format, use it directly
        if (formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formData.append('date_of_birth', formattedDate);
          console.log('Date appended in YYYY-MM-DD format:', formattedDate);
        } else {
          console.log('Date format not recognized, not appending to form');
        }
      } else {
        console.log('Date of birth is invalid or null, not appending to form');
      }
      
      formData.append('gender', idDetails.gender || 'male'); // Default to male if not specified
      formData.append('district_of_birth', idDetails.district_of_birth || idDetails.home_district);
      formData.append('father_name', idDetails.father_name);
      formData.append('mother_name', idDetails.mother_name);
      formData.append('home_district', idDetails.home_district);
      formData.append('division', idDetails.division || idDetails.home_district);
      formData.append('location', idDetails.location || idDetails.home_district);
      formData.append('sub_location', idDetails.sub_location || idDetails.home_district);
      formData.append('tribe', idDetails.tribe || 'Not specified');
      formData.append('village_estate', idDetails.village_estate || 'Not specified');
      
      // Add additional fields from ID details
      formData.append('marital_status', idDetails.marital_status || 'Not specified');
      formData.append('occupation', idDetails.occupation || 'Not specified');
      formData.append('constituency', constituency);
      
      // Append files
      formData.append('ob_photo', obPhoto);
      formData.append('passport_photo', passportPhoto);
      formData.append('birth_certificate', birthCertificate);

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('officerToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('http://localhost:5000/api/applications/lost-id', {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Success",
          description: "Lost ID application submitted successfully"
        });
        
        console.log('LostIdReplacement - Application submitted successfully');
        console.log('LostIdReplacement - Response data:', data);
        console.log('LostIdReplacement - idDetails.full_names:', idDetails.full_names);
        console.log('LostIdReplacement - Navigating to payment with state:', { 
          applicationNumber: data.applicationNumber,
          applicationId: data.applicationId,
          waitingCardNumber: data.waitingCardNumber,
          fullName: idDetails.full_names
        });
        
        // Navigate to payment page with application data
        navigate('/officer/lost-id/payment', { 
          state: { 
            applicationNumber: data.applicationNumber,
            applicationId: data.applicationId,
            waitingCardNumber: data.waitingCardNumber,
            fullName: idDetails.full_names
          } 
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lost ID Replacement</h1>
            <p className="text-muted-foreground">Process lost ID replacement applications</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/officer/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Search ID Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Lost ID
            </CardTitle>
            <CardDescription>
              Enter the ID number of the lost ID to retrieve details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={searchIdNumber}
                  onChange={(e) => setSearchIdNumber(e.target.value)}
                  placeholder="Enter ID number (e.g., ID202400000001)"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearchId}
                  disabled={searching}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ID Details Display */}
        {idDetails && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ID Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Full Names</Label>
                  <p className="text-sm font-medium">{idDetails.full_names}</p>
                </div>
                <div>
                  <Label>ID Number</Label>
                  <p className="text-sm font-medium">{idDetails.generated_id_number}</p>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <p className="text-sm font-medium">{new Date(idDetails.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Gender</Label>
                  <p className="text-sm font-medium">{idDetails.gender || 'N/A'}</p>
                </div>
                <div>
                  <Label>District of Birth</Label>
                  <p className="text-sm font-medium">{idDetails.district_of_birth || 'N/A'}</p>
                </div>
                <div>
                  <Label>Home District</Label>
                  <p className="text-sm font-medium">{idDetails.home_district}</p>
                </div>
                <div>
                  <Label>Division</Label>
                  <p className="text-sm font-medium">{idDetails.division || 'N/A'}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm font-medium">{idDetails.location || 'N/A'}</p>
                </div>
                <div>
                  <Label>Sub-Location</Label>
                  <p className="text-sm font-medium">{idDetails.sub_location || 'N/A'}</p>
                </div>
                <div>
                  <Label>Father's Name</Label>
                  <p className="text-sm font-medium">{idDetails.father_name}</p>
                </div>
                <div>
                  <Label>Mother's Name</Label>
                  <p className="text-sm font-medium">{idDetails.mother_name}</p>
                </div>
                <div>
                  <Label>Tribe</Label>
                  <p className="text-sm font-medium">{idDetails.tribe || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lost ID Application Form */}
        {idDetails && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lost ID Application Details
              </CardTitle>
              <CardDescription>
                Fill in the OB details and upload required documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OB Number and Constituency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="obNumber">OB Number *</Label>
                  <Input
                    id="obNumber"
                    value={obNumber}
                    onChange={(e) => setObNumber(e.target.value)}
                    placeholder="Enter Occurrence Book (OB) number"
                  />
                </div>
                <div>
                  <Label htmlFor="constituency">Constituency *</Label>
                  <Select value={constituency} onValueChange={setConstituency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {constituencies.map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.name}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* OB Photo */}
                <div>
                  <Label htmlFor="obPhoto">OB Photo *</Label>
                  <div className="mt-2">
                    <Input
                      id="obPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, setObPhoto)}
                    />
                    {obPhoto && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {obPhoto.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* New Passport Photo */}
                <div>
                  <Label htmlFor="passportPhoto">New Passport Photo *</Label>
                  <div className="mt-2">
                    <Input
                      id="passportPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, setPassportPhoto)}
                    />
                    {passportPhoto && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {passportPhoto.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Birth Certificate */}
                <div>
                  <Label htmlFor="birthCertificate">Birth Certificate *</Label>
                  <div className="mt-2">
                    <Input
                      id="birthCertificate"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, setBirthCertificate)}
                    />
                    {birthCertificate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {birthCertificate.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitLostIdApplication}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Notice */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Important Information</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  • Ensure all uploaded documents are clear and readable<br/>
                  • The OB number must be valid and verifiable<br/>
                  • A renewal fee will be required before processing<br/>
                  • The original ID number will be retained for the replacement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LostIdReplacement;