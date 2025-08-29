import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { generateWaitingCard } from '@/lib/pdfGenerator';

const NewApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null);
  const [parentsId, setParentsId] = useState<File | null>(null);
  const [constituencies, setConstituencies] = useState<{id: number; name: string}[]>([]);

  const [formData, setFormData] = useState({
    // Personal Information
    fullNames: '',
    dateOfBirth: '',
    gender: '',
    fatherName: '',
    motherName: '',
    maritalStatus: '',
    husbandName: '',
    husbandIdNo: '',
    
    // Location Information
    districtOfBirth: '',
    tribe: '',
    clan: '',
    family: '',
    homeDistrict: '',
    division: '',
    constituency: '',
    location: '',
    subLocation: '',
    villageEstate: '',
    homeAddress: '',
    occupation: '',
    
    // Supporting Documents
    documents: {
      birthCertificate: false,
      birthCertificateNo: '',
      religiousCard: false,
      parentsId: false,
      parentsIdNo: '',
      passport: false,
      passportNo: '',
      otherDocument: false,
      otherDocumentDetails: ''
    }
  });

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: checked
      }
    }));
  };

  const handleDocumentNumberChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: value
      }
    }));
  };

  const handleFileUpload = (type: 'passport' | 'birth' | 'parents', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'passport') setPassportPhoto(file);
      else if (type === 'birth') setBirthCertificate(file);
      else if (type === 'parents') setParentsId(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'documents') {
          submitData.append('supportingDocuments', JSON.stringify(value));
        } else {
          submitData.append(key, value as string);
        }
      });

      // Attach submitting officer
      const storedOfficer = localStorage.getItem('officerData');
      if (storedOfficer) {
        try {
          const officer = JSON.parse(storedOfficer);
          if (officer?.id) submitData.append('officerId', String(officer.id));
        } catch {}
      }

      // Add files
      if (passportPhoto) submitData.append('passportPhoto', passportPhoto);
      if (birthCertificate) submitData.append('birthCertificate', birthCertificate);
      if (parentsId) submitData.append('parentsId', parentsId);

      // Submit to backend
      const token = localStorage.getItem('officerToken') || '';
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Generate waiting card immediately after successful submission
        const stored = localStorage.getItem('officerData');
        const officer = stored ? JSON.parse(stored) : null;
        const waitingCardData = {
          applicationNumber: String(responseData.applicationNumber || ''),
          fullName: String(formData.fullNames || ''),
          district: String(formData.homeDistrict || ''),
          applicationType: 'New Application',
          officerName: String(officer?.fullName || 'Registration Officer'),
          date: new Date().toLocaleDateString()
        };
        
        await generateWaitingCard(waitingCardData);
        
        toast({
          title: "Success",
          description: "Application submitted successfully and waiting card generated",
        });
        navigate('/officer/dashboard');
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/officer/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">New ID Application</h1>
            <p className="text-muted-foreground">Digital Registration Form</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullNames">Full Names (Majina Kamill)</Label>
                  <Input
                    id="fullNames"
                    value={formData.fullNames}
                    onChange={(e) => handleInputChange('fullNames', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth (Tarehe ya Kuzaliwa)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    max={(() => {
                      const today = new Date();
                      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                      return eighteenYearsAgo.toISOString().split('T')[0];
                    })()}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      const age = today.getFullYear() - selectedDate.getFullYear() - 
                        (today < new Date(today.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) ? 1 : 0);
                      
                      if (age < 18) {
                        toast({
                          title: "Age Requirement",
                          description: "Applicant must be 18 years or older",
                          variant: "destructive"
                        });
                        return;
                      }
                      handleInputChange('dateOfBirth', e.target.value);
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be 18 years or older</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender (Mume/Mke)</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name (Majina ya Baba)</Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name (Majina ya Mama)</Label>
                  <Input
                    id="motherName"
                    value={formData.motherName}
                    onChange={(e) => handleInputChange('motherName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.maritalStatus === 'married' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="husbandName">Husband's Full Names</Label>
                      <Input
                        id="husbandName"
                        value={formData.husbandName}
                        onChange={(e) => handleInputChange('husbandName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="husbandIdNo">Husband's ID No.</Label>
                      <Input
                        id="husbandIdNo"
                        value={formData.husbandIdNo}
                        onChange={(e) => handleInputChange('husbandIdNo', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="districtOfBirth">District of Birth</Label>
                  <Input
                    id="districtOfBirth"
                    value={formData.districtOfBirth}
                    onChange={(e) => handleInputChange('districtOfBirth', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tribe">Tribe (Kabila)</Label>
                  <Input
                    id="tribe"
                    value={formData.tribe}
                    onChange={(e) => handleInputChange('tribe', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clan">Clan (Ukoo)</Label>
                  <Input
                    id="clan"
                    value={formData.clan}
                    onChange={(e) => handleInputChange('clan', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="family">Family (Mlango)</Label>
                  <Input
                    id="family"
                    value={formData.family}
                    onChange={(e) => handleInputChange('family', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homeDistrict">Home District</Label>
                  <Input
                    id="homeDistrict"
                    value={formData.homeDistrict}
                    onChange={(e) => handleInputChange('homeDistrict', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Division (Taarafa)</Label>
                  <Input
                    id="division"
                    value={formData.division}
                    onChange={(e) => handleInputChange('division', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constituency">Constituency</Label>
                  <Select value={formData.constituency} onValueChange={(value) => handleInputChange('constituency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {constituencies.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Mtaa)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subLocation">Sub-location</Label>
                  <Input
                    id="subLocation"
                    value={formData.subLocation}
                    onChange={(e) => handleInputChange('subLocation', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="villageEstate">Village/Estate</Label>
                  <Input
                    id="villageEstate"
                    value={formData.villageEstate}
                    onChange={(e) => handleInputChange('villageEstate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homeAddress">Home Address</Label>
                  <Input
                    id="homeAddress"
                    value={formData.homeAddress}
                    onChange={(e) => handleInputChange('homeAddress', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents in Support of Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="birthCertificate"
                    checked={formData.documents.birthCertificate}
                    onCheckedChange={(checked) => handleDocumentChange('birthCertificate', checked as boolean)}
                  />
                  <Label htmlFor="birthCertificate">Birth Certificate or School Leaving Certificate No.</Label>
                  <Input
                    placeholder="Certificate Number"
                    value={formData.documents.birthCertificateNo}
                    onChange={(e) => handleDocumentNumberChange('birthCertificateNo', e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="religiousCard"
                    checked={formData.documents.religiousCard}
                    onCheckedChange={(checked) => handleDocumentChange('religiousCard', checked as boolean)}
                  />
                  <Label htmlFor="religiousCard">Religious Card or Assessment Certificate</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parentsId"
                    checked={formData.documents.parentsId}
                    onCheckedChange={(checked) => handleDocumentChange('parentsId', checked as boolean)}
                  />
                  <Label htmlFor="parentsId">Parents ID/Card No.</Label>
                  <Input
                    placeholder="Parent's ID Number (7-9 digits)"
                    value={formData.documents.parentsIdNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 9) {
                        handleDocumentNumberChange('parentsIdNo', value);
                      }
                    }}
                    pattern="[0-9]{7,9}"
                    minLength={7}
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passport"
                    checked={formData.documents.passport}
                    onCheckedChange={(checked) => handleDocumentChange('passport', checked as boolean)}
                  />
                  <Label htmlFor="passport">Passport or Registration Certificate No.</Label>
                  <Input
                    placeholder="Passport/Certificate Number"
                    value={formData.documents.passportNo}
                    onChange={(e) => handleDocumentNumberChange('passportNo', e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="otherDocument"
                      checked={formData.documents.otherDocument}
                      onCheckedChange={(checked) => handleDocumentChange('otherDocument', checked as boolean)}
                    />
                    <Label htmlFor="otherDocument">Any other document</Label>
                  </div>
                  {formData.documents.otherDocument && (
                    <Textarea
                      placeholder="Specify other document details"
                      value={formData.documents.otherDocumentDetails}
                      onChange={(e) => handleDocumentNumberChange('otherDocumentDetails', e.target.value)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>File Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Passport Photo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('passport', e)}
                      className="hidden"
                      id="passport-upload"
                    />
                    <label htmlFor="passport-upload" className="cursor-pointer">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {passportPhoto ? passportPhoto.name : "Upload passport photo"}
                      </p>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Birth Certificate</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload('birth', e)}
                      className="hidden"
                      id="birth-upload"
                    />
                    <label htmlFor="birth-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {birthCertificate ? birthCertificate.name : "Upload birth certificate"}
                      </p>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Parents' ID</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload('parents', e)}
                      className="hidden"
                      id="parents-upload"
                    />
                    <label htmlFor="parents-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {parentsId ? parentsId.name : "Upload parents' ID"}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/officer/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewApplication;