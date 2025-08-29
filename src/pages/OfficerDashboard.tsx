import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, FileText, Users, CheckCircle, Package, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: number;
  application_number: string;
  full_names: string;
  status: string;
  created_at: string;
  updated_at: string;
  generated_id_number: string;
}

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [officerData, setOfficerData] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("officerToken");
    const storedOfficerData = localStorage.getItem("officerData");
    
    if (!token || !storedOfficerData) {
      navigate("/officer");
      return;
    }

    try {
      const parsedData = JSON.parse(storedOfficerData);
      console.log('Parsed officer data from localStorage:', parsedData);
      setOfficerData(parsedData);
    } catch (error) {
      console.error("Error parsing officer data:", error);
      navigate("/officer");
    }
  }, [navigate]);

  // Fetch applications when officer data is available
  useEffect(() => {
    if (officerData) {
      fetchApplications();
    }
  }, [officerData]);

  // Update filtered applications when applications change
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setFilteredApplications(applications);
    }
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('Officer data:', officerData);
      console.log('Fetching applications for officer_id:', officerData.id);
      
      // Use the correct officer applications endpoint with officer_id parameter
      const response = await fetch(`http://localhost:5000/api/officer/applications?officer_id=${officerData.id}`);
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched applications data:', data);
        console.log('Applications array:', data);
        setApplications(data || []);
        setFilteredApplications(data || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch applications:', response.status, response.statusText, errorText);
        toast({
          title: "Error",
          description: "Failed to load applications",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredApplications(applications);
    } else {
      const filtered = applications.filter(app => 
        app.full_names.toLowerCase().includes(query.toLowerCase()) ||
        app.application_number.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredApplications(filtered);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("officerToken");
    localStorage.removeItem("officerData");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/officer");
  };

  const handleCardArrived = async (applicationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/officer/applications/${applicationId}/card-arrived`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'card_arrived'
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "ID card arrival confirmed"
        });
        fetchApplications();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to confirm card arrival",
        variant: "destructive"
      });
    }
  };

  const handleCardCollected = async (applicationId: number) => {
    try {
      console.log('Attempting to mark card as collected for application:', applicationId);
      const response = await fetch(`http://localhost:5000/api/officer/applications/${applicationId}/card-collected`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "ID card collection confirmed"
        });
        fetchApplications();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm card collection", 
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, generatedIdNumber?: string) => {
    const statusConfig = {
      'submitted': { label: 'Submitted', variant: 'secondary' as const },
      'approved': { label: 'Approved', variant: 'default' as const },
      'rejected': { label: 'Rejected', variant: 'destructive' as const },
      'dispatched': { label: 'Dispatched', variant: 'outline' as const },
      'ready_for_collection': { label: 'Ready for Collection', variant: 'secondary' as const },
      'collected': { label: 'Collected', variant: 'default' as const }
    };
    
    // Handle empty or null status
    let normalizedStatus = status?.trim();
    
    // If status is empty but there's a generated ID number, it means it's completed
    if (!normalizedStatus && generatedIdNumber) {
      normalizedStatus = 'collected';
    } else if (!normalizedStatus) {
      normalizedStatus = 'submitted';
    }
    
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || { label: normalizedStatus, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!officerData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Officer Dashboard</h1>
            <p className="text-muted-foreground">Digital ID Management System</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Welcome, {officerData.fullName}
              </CardTitle>
              <CardDescription>
                Station: {officerData.station} | Status: {officerData.status}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Application History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    New Application
                  </CardTitle>
                  <CardDescription>
                    Process new ID applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/officer/new-application')}
                  >
                    Start New Application
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Lost ID Replacement
                  </CardTitle>
                  <CardDescription>
                    Process lost ID replacement applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate('/officer/lost-id')}
                  >
                    Replace Lost ID
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pending Applications
                  </CardTitle>
                  <CardDescription>
                    Applications awaiting approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {applications.filter(app => app.status === 'submitted').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Total Applications
                  </CardTitle>
                  <CardDescription>
                    All applications processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {applications.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Application History</CardTitle>
                <CardDescription>
                  Manage all applications and track ID card status
                </CardDescription>
                <div className="mt-4">
                  <Input
                    placeholder="Search by name or application number..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No applications match your search' : 'No applications found'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application #</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            {app.application_number}
                          </TableCell>
                          <TableCell>{app.full_names}</TableCell>
                          <TableCell>
                            {app.generated_id_number || 'Pending'}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status, app.generated_id_number)}</TableCell>
                          <TableCell>
                            {new Date(app.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {app.status === 'dispatched' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCardArrived(app.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Package className="h-3 w-3" />
                                  Card Arrived
                                </Button>
                              )}
                              {(app.status === 'ready_for_collection' || (app.status === '' && app.generated_id_number)) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCardCollected(app.id)}
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Collected
                                </Button>
                              )}
                              {/* Show debug info for troubleshooting */}
                              {process.env.NODE_ENV === 'development' && (
                                <span className="text-xs text-muted-foreground">
                                  Status: "{app.status}"
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {applications.filter(app => {
                    const today = new Date();
                    const appDate = new Date(app.created_at);
                    return appDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Today's Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {applications.filter(app => {
                    const today = new Date();
                    const appDate = new Date(app.created_at);
                    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                    return appDate >= weekStart;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {applications.filter(app => {
                    const today = new Date();
                    const appDate = new Date(app.created_at);
                    return appDate.getMonth() === today.getMonth() && appDate.getFullYear() === today.getFullYear();
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {applications.filter(app => app.status === 'collected' || (app.status === '' && app.generated_id_number)).length}
                </div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;