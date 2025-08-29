
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Check, X, User, Phone, Mail, Building, FileText, Calendar, Eye, Truck, LogOut, Trash2, Pause, Printer, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ApplicationDetails from '@/components/ApplicationDetails';
import IdCardPreview from '@/components/IdCardPreview';
import AdminReports from '@/components/AdminReports';

interface PendingOfficer {
  id: number;
  id_number: string;
  email: string;
  phone_number: string;
  full_name: string;
  station: string;
  created_at: string;
}

interface Application {
  id: number;
  application_number: string;
  full_names: string;
  status: string;
  application_type: string;
  created_at: string;
  updated_at: string;
  officer_name: string;
  generated_id_number?: string;
}

interface ApprovedOfficer {
  id: number;
  id_number: string;
  email: string;
  phone_number: string;
  full_name: string;
  station: string;
  status: string;
  created_at: string;
}

interface Constituency {
  id: number;
  name: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [pendingOfficers, setPendingOfficers] = useState<PendingOfficer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<Application[]>([]);
  const [approvedOfficers, setApprovedOfficers] = useState<ApprovedOfficer[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<Application[]>([]);
  const [newConstituency, setNewConstituency] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewApplications, setPreviewApplications] = useState<Application[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOfficers();
    fetchApplications();
    fetchDispatchApplications();
    fetchApprovedOfficers();
    fetchConstituencies();
    fetchApplicationHistory();
    fetchPreviewApplications();
  }, []);

  const fetchPendingOfficers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/officers/pending');
      const data = await response.json();
      
      if (response.ok) {
        setPendingOfficers(data.officers);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch pending officers",
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

  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/applications');
      const data = await response.json();
      
      if (response.ok) {
        setApplications(data.applications);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch applications",
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

  const handleApprove = async (officerId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/officers/${officerId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Officer approved successfully",
        });
        // Remove approved officer from the list
        setPendingOfficers(prev => prev.filter(officer => officer.id !== officerId));
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve officer",
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

  const handleReject = async (officerId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/officers/${officerId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Officer rejected",
        });
        // Remove rejected officer from the list
        setPendingOfficers(prev => prev.filter(officer => officer.id !== officerId));
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject officer",
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

  const handleViewDetails = (applicationId: number) => {
    setSelectedApplicationId(applicationId);
    setDetailsOpen(true);
  };

  const fetchDispatchApplications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/applications/dispatch');
      const data = await response.json();
      
      if (response.ok) {
        setApprovedApplications(data.applications);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch dispatch applications",
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

  const handleDispatch = async (applicationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/applications/${applicationId}/dispatch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "ID dispatched successfully",
        });
        // Remove dispatched application from approved list
        setApprovedApplications(prev => prev.filter(app => app.id !== applicationId));
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to dispatch ID",
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

  const handleApplicationUpdate = () => {
    fetchApplications();
    fetchDispatchApplications();
    fetchPreviewApplications();
  };

  const fetchPreviewApplications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/applications/preview');
      const data = await response.json();
      
      if (response.ok) {
        setPreviewApplications(data.applications);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch preview applications",
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

  const handlePreview = (applicationId: number) => {
    setSelectedApplicationId(applicationId);
    setPreviewOpen(true);
  };

  const handlePrintComplete = () => {
    fetchPreviewApplications();
    fetchDispatchApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'dispatched':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchApprovedOfficers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/officers/approved');
      const data = await response.json();
      
      if (response.ok) {
        setApprovedOfficers(data.officers);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch approved officers",
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

  const handleSuspendOfficer = async (officerId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/officers/${officerId}/suspend`, { method: 'PUT' });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Officer Suspended', description: 'The officer has been suspended.' });
        setApprovedOfficers(prev => prev.map(o => o.id === officerId ? { ...o, status: 'suspended' } : o));
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to suspend officer', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to connect to server', variant: 'destructive' });
    }
  };

  const handleUnsuspendOfficer = async (officerId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/officers/${officerId}/unsuspend`, { method: 'PUT' });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Officer Unsuspended', description: 'The officer has been reactivated.' });
        setApprovedOfficers(prev => prev.map(o => o.id === officerId ? { ...o, status: 'approved' } : o));
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to unsuspend officer', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to connect to server', variant: 'destructive' });
    }
  };

  const handleDeleteOfficer = async (officerId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/officers/${officerId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Officer Deleted', description: 'The officer has been removed.' });
        setApprovedOfficers(prev => prev.filter(o => o.id !== officerId));
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete officer', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to connect to server', variant: 'destructive' });
    }
  };

  const fetchConstituencies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/constituencies');
      const data = await response.json();
      
      if (response.ok) {
        setConstituencies(data.constituencies);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch constituencies",
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

  const fetchApplicationHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/applications/history');
      const data = await response.json();
      
      if (response.ok) {
        setApplicationHistory(data.applications);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch application history",
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

  const handleAddConstituency = async () => {
    if (!newConstituency.trim()) {
      toast({
        title: "Error",
        description: "Please enter a constituency name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/constituencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newConstituency.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Constituency added successfully",
        });
        setNewConstituency('');
        fetchConstituencies();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add constituency",
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

  const handleDeleteConstituency = async (constituencyId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/constituencies/${constituencyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Constituency deleted successfully",
        });
        fetchConstituencies();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete constituency",
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

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ID Applications
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              ID Preview
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Dispatch IDs
            </TabsTrigger>
            <TabsTrigger value="officers" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Officer Applications
            </TabsTrigger>
            <TabsTrigger value="approved-officers" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Approved Officers
            </TabsTrigger>
            <TabsTrigger value="constituencies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Constituencies
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Application History
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pending ID Applications
                </CardTitle>
                <CardDescription>
                  Review and manage newly submitted ID applications requiring approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending ID applications found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application Details</TableHead>
                          <TableHead>Applicant Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Processing Officer</TableHead>
                          <TableHead>Application Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{application.application_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {application.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{application.full_names}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {application.application_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{application.officer_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(application.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(application.status)}>
                                {application.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(application.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  ID Card Preview & Printing
                </CardTitle>
                <CardDescription>
                  Preview approved ID cards before printing and dispatch
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications ready for preview
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application Details</TableHead>
                          <TableHead>Applicant Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Generated ID Number</TableHead>
                          <TableHead>Approved Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewApplications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{application.application_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {application.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{application.full_names}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {application.application_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {application.generated_id_number || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(application.updated_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handlePreview(application.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview ID Card
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispatch">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Dispatch Approved IDs
                </CardTitle>
                <CardDescription>
                  Dispatch approved ID cards to applicants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No approved applications ready for dispatch
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application Details</TableHead>
                          <TableHead>Applicant Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Generated ID Number</TableHead>
                          <TableHead>Approved Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedApplications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{application.application_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {application.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{application.full_names}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {application.application_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {application.generated_id_number || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(application.updated_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleDispatch(application.id)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Dispatch
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="officers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Officer Applications - Pending Approval
                </CardTitle>
                <CardDescription>
                  Review and approve officer applications to grant system access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingOfficers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending officer applications
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Officer Details</TableHead>
                          <TableHead>Contact Information</TableHead>
                          <TableHead>Station</TableHead>
                          <TableHead>Applied Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingOfficers.map((officer) => (
                          <TableRow key={officer.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{officer.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {officer.id_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4" />
                                  {officer.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4" />
                                  {officer.phone_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {officer.station}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(officer.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Pending</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(officer.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(officer.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved-officers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Approved Officers
                </CardTitle>
                <CardDescription>
                  List of all approved application officers in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedOfficers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No approved officers found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Officer Details</TableHead>
                          <TableHead>Contact Information</TableHead>
                          <TableHead>Station</TableHead>
                          <TableHead>Approved Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedOfficers.map((officer) => (
                          <TableRow key={officer.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{officer.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {officer.id_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4" />
                                  {officer.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4" />
                                  {officer.phone_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {officer.station}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(officer.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                officer.status === 'suspended' 
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" 
                                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              }>
                                {officer.status === 'suspended' ? 'SUSPENDED' : 'APPROVED'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {officer.status === 'suspended' ? (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUnsuspendOfficer(officer.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Unsuspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuspendOfficer(officer.id)}
                                  >
                                    <Pause className="h-4 w-4 mr-1" />
                                    Suspend
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteOfficer(officer.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="constituencies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Constituency Management
                </CardTitle>
                <CardDescription>
                  Add and manage constituencies for officer stations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="newConstituency">Add New Constituency</Label>
                    <Input
                      id="newConstituency"
                      placeholder="Enter constituency name"
                      value={newConstituency}
                      onChange={(e) => setNewConstituency(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddConstituency}>
                      Add Constituency
                    </Button>
                  </div>
                </div>

                {constituencies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No constituencies found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Constituency Name</TableHead>
                          <TableHead>Created Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {constituencies.map((constituency) => (
                          <TableRow key={constituency.id}>
                            <TableCell>
                              <div className="font-medium">{constituency.name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(constituency.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteConstituency(constituency.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Application History
                </CardTitle>
                <CardDescription>
                  Complete history of all ID applications ever submitted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applicationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No application history found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application Details</TableHead>
                          <TableHead>Applicant Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Processing Officer</TableHead>
                          <TableHead>Application Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Generated ID Number</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applicationHistory.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{application.application_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {application.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{application.full_names}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {application.application_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{application.officer_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(application.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(application.status)}>
                                {application.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {application.generated_id_number || 'N/A'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
        </Tabs>

        {selectedApplicationId && (
          <ApplicationDetails
            applicationId={selectedApplicationId}
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            onUpdate={handleApplicationUpdate}
          />
        )}

        {selectedApplicationId && (
          <IdCardPreview
            applicationId={selectedApplicationId}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            onPrint={handlePrintComplete}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
