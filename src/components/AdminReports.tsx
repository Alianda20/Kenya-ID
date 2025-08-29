import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ReportApplication {
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

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  period: string;
  reportType: string;
  constituency: string;
}

interface Constituency {
  id: number;
  name: string;
  created_at: string;
}

const AdminReports = () => {
  const [reportData, setReportData] = useState<ReportApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'all',
    period: 'weekly',
    reportType: 'applications',
    constituency: 'all'
  });
  const [reportStats, setReportStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    dispatched: 0,
    collected: 0
  });

  const { toast } = useToast();

  // Fetch constituencies on component mount
  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/constituencies');
        const data = await response.json();
        if (response.ok) {
          setConstituencies(data.constituencies || []);
        }
      } catch (error) {
        console.error('Failed to fetch constituencies:', error);
      }
    };
    fetchConstituencies();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        status: filters.status,
        report_type: filters.reportType,
        constituency: filters.constituency
      });

      const response = await fetch(`http://localhost:5000/api/admin/reports?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReportData(data.applications || []);
        setReportStats(data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          dispatched: 0,
          collected: 0
        });
        toast({
          title: "Report Generated",
          description: `Generated ${data.applications?.length || 0} records`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate report",
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

  const exportReport = async (exportFormat: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        status: filters.status,
        report_type: filters.reportType,
        constituency: filters.constituency,
        format: exportFormat
      });

      const response = await fetch(`http://localhost:5000/api/admin/reports/export?${params}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filters.reportType}_report_${filters.startDate}_to_${filters.endDate}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: `Report exported as ${exportFormat.toUpperCase()}`,
        });
      } else {
        const data = await response.json();
        toast({
          title: "Export Failed",
          description: data.error || "Failed to export report",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
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
      case 'card_arrived':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'collected':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
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

  const handleQuickPeriod = (period: string) => {
    const today = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    setFilters(prev => ({
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      period
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reports & Analytics
          </CardTitle>
          <CardDescription>
            Generate comprehensive reports on ID applications, approvals, dispatches, and collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Applications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select 
                    value={filters.reportType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applications">All Applications</SelectItem>
                      <SelectItem value="renewals">Renewals Only</SelectItem>
                      <SelectItem value="new_applications">New Applications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status Filter</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="submitted">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="card_arrived">Card Arrived</SelectItem>
                      <SelectItem value="collected">Collected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constituency">Constituency</Label>
                  <Select 
                    value={filters.constituency} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, constituency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Constituencies</SelectItem>
                      {constituencies.map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.name}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickPeriod('today')}
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickPeriod('week')}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickPeriod('month')}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickPeriod('quarter')}
                >
                  Last 90 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickPeriod('year')}
                >
                  Last Year
                </Button>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={generateReport} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
                
                {reportData.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => exportReport('csv')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportReport('pdf')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </>
                )}
              </div>

              {/* Report Statistics */}
              {reportData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{reportStats.total}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{reportStats.pending}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{reportStats.approved}</div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{reportStats.rejected}</div>
                        <div className="text-sm text-muted-foreground">Rejected</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{reportStats.dispatched}</div>
                        <div className="text-sm text-muted-foreground">Dispatched</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{reportStats.collected}</div>
                        <div className="text-sm text-muted-foreground">Collected</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Report Data Table */}
              {reportData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Report Results</CardTitle>
                    <CardDescription>
                      {reportData.length} records found for the selected criteria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Application Number</TableHead>
                            <TableHead>Applicant Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Officer</TableHead>
                            <TableHead>Created Date</TableHead>
                            <TableHead>ID Number</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.map((application) => (
                            <TableRow key={application.id}>
                              <TableCell>
                                <div className="font-medium">{application.application_number}</div>
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
                                <Badge className={getStatusColor(application.status)}>
                                  {application.status.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{application.officer_name}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{formatDate(application.created_at)}</div>
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
                  </CardContent>
                </Card>
              )}

              {reportData.length === 0 && !loading && (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No data available. Generate a report to see results.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;