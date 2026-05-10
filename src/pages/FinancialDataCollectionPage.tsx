import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authFetch } from '../auth/authClient';

type ApiResponseBody = Record<string, unknown>;

function getStringValue(data: ApiResponseBody | null, keys: string[]) {
  if (!data) {
    return undefined;
  }

  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return undefined;
}

async function readJsonResponse(response: Response): Promise<ApiResponseBody | null> {
  try {
    return (await response.json()) as ApiResponseBody;
  } catch {
    return null;
  }
}

export default function FinancialDataCollectionPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstPan, setGstPan] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');

  const [annualRevenue, setAnnualRevenue] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [profitEstimate, setProfitEstimate] = useState('');
  const [existingEmi, setExistingEmi] = useState('');

  const [requestedAmount, setRequestedAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tenure, setTenure] = useState('');

  const [bankStatements, setBankStatements] = useState<FileList | null>(null);
  const [gstReturns, setGstReturns] = useState<FileList | null>(null);
  const [itrFiles, setItrFiles] = useState<FileList | null>(null);
  const [balanceSheetFiles, setBalanceSheetFiles] = useState<FileList | null>(null);
  const [loanDocuments, setLoanDocuments] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createFileHandler = (
    setter: Dispatch<SetStateAction<FileList | null>>
  ) => (event: ChangeEvent<HTMLInputElement>) => {
    setter(event.target.files);
  };

  const appendFiles = (formData: FormData, fieldName: string, files: FileList | null) => {
    if (!files) {
      return;
    }

    Array.from(files).forEach((file) => {
      formData.append(fieldName, file);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.append('businessName', businessName);
    formData.append('businessType', businessType);
    formData.append('gstPan', gstPan);
    formData.append('industry', industry);
    formData.append('yearsInBusiness', yearsInBusiness);
    formData.append('annualRevenue', annualRevenue);
    formData.append('monthlyExpenses', monthlyExpenses);
    formData.append('profitEstimate', profitEstimate);
    formData.append('existingEmi', existingEmi);
    formData.append('requestedAmount', requestedAmount);
    formData.append('purpose', purpose);
    formData.append('tenure', tenure);
    appendFiles(formData, 'bankStatements', bankStatements);
    appendFiles(formData, 'gstReturns', gstReturns);
    appendFiles(formData, 'itrFiles', itrFiles);
    appendFiles(formData, 'balanceSheetFiles', balanceSheetFiles);
    appendFiles(formData, 'loanDocuments', loanDocuments);

    try {
      const response = await authFetch('/api/data/save', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let message = 'Unable to save loan assessment data.';

        const errorBody = await readJsonResponse(response);
        message = getStringValue(errorBody, ['message', 'error']) ?? message;

        throw new Error(message);
      }

      const responseBody = await readJsonResponse(response);
      const applicationId = getStringValue(responseBody, [
        'applicationId',
        'applicationID',
        'application_id',
        'id'
      ]);

      setSubmitMessage(
        applicationId
          ? `Application submitted. Here is your ID ${applicationId}.`
          : 'Application submitted.'
      );
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFileList = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return null;
    }

    return (
      <ul className="attachment-list">
        {Array.from(files).map((file) => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    );
  };

  return (
    <main className="page-shell">
      <section className="card">
        <div className="page-header">
          <div>
            <h1>Loan Assessment</h1>
            <p>Welcome, {user?.user.name}</p>
          </div>
          <button className="secondary" onClick={() => { signOut(); navigate('/login'); }}>
            Sign out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="section-block">
            <div className="section-heading">
              <div>
                <h2>Business Details</h2>
                <p>Collect core company information for the assessment.</p>
              </div>
            </div>

            <div className="field-grid">
              <label className="field-group">
                Business name
                <input
                  type="text"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Enter business name"
                  required
                />
              </label>
              <label className="field-group">
                Business type
                <input
                  type="text"
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  placeholder="Sole proprietorship, Pvt Ltd, etc."
                />
              </label>
              <label className="field-group">
                GST / PAN
                <input
                  type="text"
                  value={gstPan}
                  onChange={(event) => setGstPan(event.target.value)}
                  placeholder="GST or PAN number"
                />
              </label>
              <label className="field-group">
                Industry
                <input
                  type="text"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="e.g. manufacturing, retail"
                />
              </label>
              <label className="field-group">
                Years in business
                <input
                  type="number"
                  value={yearsInBusiness}
                  onChange={(event) => setYearsInBusiness(event.target.value)}
                  placeholder="Years"
                  min="0"
                />
              </label>
            </div>
          </div>

          <div className="section-block">
            <div className="section-heading">
              <div>
                <h2>Financial Snapshot</h2>
                <p>Capture revenue, expenses, profit and EMI burden.</p>
              </div>
            </div>

            <div className="field-grid">
              <label className="field-group">
                Annual revenue
                <input
                  type="number"
                  value={annualRevenue}
                  onChange={(event) => setAnnualRevenue(event.target.value)}
                  placeholder="Annual sales"
                />
              </label>
              <label className="field-group">
                Monthly expenses
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(event) => setMonthlyExpenses(event.target.value)}
                  placeholder="Monthly operating costs"
                />
              </label>
              <label className="field-group">
                Profit estimate
                <input
                  type="number"
                  value={profitEstimate}
                  onChange={(event) => setProfitEstimate(event.target.value)}
                  placeholder="Estimated monthly profit"
                />
              </label>
              <label className="field-group">
                Existing EMI
                <input
                  type="number"
                  value={existingEmi}
                  onChange={(event) => setExistingEmi(event.target.value)}
                  placeholder="Total monthly EMI"
                />
              </label>
            </div>
          </div>

          <div className="section-block">
            <div className="section-heading">
              <div>
                <h2>Loan Details</h2>
                <p>Define the requested amount, purpose and tenure.</p>
              </div>
            </div>

            <div className="field-grid">
              <label className="field-group">
                Requested amount
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(event) => setRequestedAmount(event.target.value)}
                  placeholder="Loan amount"
                  required
                />
              </label>
              <label className="field-group">
                Purpose
                <input
                  type="text"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  placeholder="e.g. working capital, expansion"
                />
              </label>
              <label className="field-group">
                Tenure (months)
                <input
                  type="number"
                  value={tenure}
                  onChange={(event) => setTenure(event.target.value)}
                  placeholder="Loan tenor"
                  min="1"
                />
              </label>
            </div>
          </div>

          <div className="section-block">
            <div className="section-heading">
              <div>
                <h2>Document Uploads</h2>
                <p>Upload required and optional documents for underwriting.</p>
              </div>
            </div>

            <label className="field-group file-group">
              <span>
                Bank statement (6 months)
                <small>Required</small>
              </span>
              <input
                type="file"
                multiple
                onChange={createFileHandler(setBankStatements)}
                accept=".pdf,.doc,.docx,image/*"
              />
            </label>

            <label className="field-group file-group">
              <span>
                GST returns
                <small>Optional</small>
              </span>
              <input
                type="file"
                multiple
                onChange={createFileHandler(setGstReturns)}
                accept=".pdf,.doc,.docx,image/*"
              />
            </label>

            <label className="field-group file-group">
              <span>
                ITR
                <small>Optional</small>
              </span>
              <input
                type="file"
                multiple
                onChange={createFileHandler(setItrFiles)}
                accept=".pdf,.doc,.docx,image/*"
              />
            </label>

            <label className="field-group file-group">
              <span>
                Balance sheet
                <small>Optional</small>
              </span>
              <input
                type="file"
                multiple
                onChange={createFileHandler(setBalanceSheetFiles)}
                accept=".pdf,.doc,.docx,image/*"
              />
            </label>

            <label className="field-group file-group">
              <span>
                Loan documents
                <small>Optional</small>
              </span>
              <input
                type="file"
                multiple
                onChange={createFileHandler(setLoanDocuments)}
                accept=".pdf,.doc,.docx,image/*"
              />
            </label>

            {bankStatements && renderFileList(bankStatements)}
            {gstReturns && renderFileList(gstReturns)}
            {itrFiles && renderFileList(itrFiles)}
            {balanceSheetFiles && renderFileList(balanceSheetFiles)}
            {loanDocuments && renderFileList(loanDocuments)}
          </div>

          {submitError && <p className="error-message">{submitError}</p>}
          {submitMessage && <p className="success-message">{submitMessage}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Submit loan assessment'}
          </button>
        </form>
      </section>
    </main>
  );
}
