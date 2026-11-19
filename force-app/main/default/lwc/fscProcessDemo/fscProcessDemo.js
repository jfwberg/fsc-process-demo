import { LightningElement, api, track } from 'lwc';

const TODAY = new Date().toISOString().split('T')[0];

const KYC_DEFAULTS = () => ({
    clientName: '',
    dateOfBirth: '',
    nationality: '',
    clientType: 'Retail',
    email: '',
    startDate: TODAY,
    docType: 'Passport',
    docNumber: '',
    docIssueDate: '',
    docExpiryDate: '',
    docIssuingCountry: '',
    docVerificationStatus: 'Pending',
    pepStatus: 'Not PEP',
    sanctionsCheck: 'Clear',
    sourceOfFunds: 'Employment',
    countryRisk: 'Low',
    riskScore: 0,
    riskRating: 'Calculating…',
    decision: null,
    decisionNote: ''
});

const LOAN_DEFAULTS = () => ({
    applicantName: '',
    purpose: '',
    amount: 250000,
    termYears: '20',
    requestedRate: 4.5,
    applicationDate: TODAY,
    annualIncome: 0,
    existingDebt: 0,
    employmentStatus: 'Employed',
    yearsEmployed: 5,
    creditScore: 700,
    collateralType: 'Residential Property',
    collateralValue: 0,
    collateralRef: '',
    guarantorName: '',
    dtiRatio: null,
    ltvRatio: null,
    suggestedRate: null,
    decision: null,
    decisionNote: ''
});

export default class FscProcessDemo extends LightningElement {

    // ─── Bridge @api inputs ───────────────────────────────────────────────
    _clientName  = '';
    _clientId    = '';
    _startDate   = TODAY;
    _initialTab  = 'kyc';
    _loanAmount  = 0;
    _dateOfBirth = '';
    _nationality = '';
    _connected   = false;
    _reloadScheduled = false;

    @api get clientName() { return this._clientName; }
    set clientName(v) {
        this._clientName = this._parseScalar(v, '');
        this._scheduleReload();
    }

    @api get clientId() { return this._clientId; }
    set clientId(v) {
        this._clientId = this._parseScalar(v, '');
        this._scheduleReload();
    }

    @api get startDate() { return this._startDate; }
    set startDate(v) {
        this._startDate = this._parseScalar(v, TODAY);
        this._scheduleReload();
    }

    @api get initialTab() { return this._initialTab; }
    set initialTab(v) {
        const val = this._parseScalar(v, 'kyc');
        this._initialTab = ['kyc', 'loan', 'flow'].includes(val) ? val : 'kyc';
        this._scheduleReload();
    }

    @api get loanAmount() { return this._loanAmount; }
    set loanAmount(v) {
        this._loanAmount = Number(v) || 0;
        this._scheduleReload();
    }

    @api get dateOfBirth() { return this._dateOfBirth; }
    set dateOfBirth(v) {
        this._dateOfBirth = this._parseScalar(v, '');
        this._scheduleReload();
    }

    @api get nationality() { return this._nationality; }
    set nationality(v) {
        this._nationality = this._parseScalar(v, '');
        this._scheduleReload();
    }

    // ─── Inbound event handler (stable reference) ─────────────────────────
    _onHostAction = (evt) => {
        try {
            const data = typeof evt.detail === 'string'
                ? JSON.parse(evt.detail)
                : (evt.detail || {});
            this._log('Inbound action received', data);
            if (data.tab) this.activeTab = data.tab;
            if (data.clientName && this.activeTab === 'kyc') {
                this.kyc = { ...this.kyc, clientName: data.clientName };
            }
        } catch (e) {
            this._log('Inbound action parse error', { error: String(e) });
        }
    };

    connectedCallback() {
        this._connected = true;
        document.addEventListener('fsc_host_action', this._onHostAction);
        this._scheduleReload();
    }

    disconnectedCallback() {
        document.removeEventListener('fsc_host_action', this._onHostAction);
    }

    // ─── State ────────────────────────────────────────────────────────────
    @track activeTab    = 'kyc';
    @track kycStep      = 1;
    @track loanStep     = 1;
    @track kyc          = KYC_DEFAULTS();
    @track loan         = LOAN_DEFAULTS();
    @track activity     = [];
    @track showActivity = false;
    @track flowFinished = false;
    @track flowResultNote = '';

    // ─── Reload logic ─────────────────────────────────────────────────────
    _scheduleReload() {
        if (!this._connected || this._reloadScheduled) return;
        this._reloadScheduled = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        Promise.resolve().then(() => {
            this._reloadScheduled = false;
            this._applyInputs();
        });
    }

    _applyInputs() {
        this.activeTab = this._initialTab;
        if (this._clientName) {
            this.kyc  = { ...this.kyc,  clientName:    this._clientName };
            this.loan = { ...this.loan, applicantName: this._clientName };
        }
        if (this._dateOfBirth) {
            this.kyc = { ...this.kyc, dateOfBirth: this._dateOfBirth };
        }
        if (this._nationality) {
            this.kyc = { ...this.kyc, nationality: this._nationality };
        }
        if (this._startDate) {
            this.kyc  = { ...this.kyc,  startDate:       this._startDate };
            this.loan = { ...this.loan, applicationDate: this._startDate };
        }
        if (this._loanAmount) {
            this.loan = { ...this.loan, amount: this._loanAmount };
        }
        this._log('Component inputs applied', {
            clientName:  this._clientName,
            clientId:    this._clientId,
            dateOfBirth: this._dateOfBirth,
            nationality: this._nationality,
            startDate:   this._startDate,
            initialTab:  this._initialTab,
            loanAmount:  this._loanAmount
        });
    }

    // ─── Computed getters ─────────────────────────────────────────────────
    get cardTitle()      { return 'FSC Process Demo'; }
    get cardSubtitle()   { return 'Financial Services Client · MCP App Bridge'; }
    get clientIdDisplay(){ return this._clientId ? `ID: ${this._clientId}` : null; }

    get isKycTab()  { return this.activeTab === 'kyc';  }
    get isLoanTab() { return this.activeTab === 'loan'; }
    get isFlowTab() { return this.activeTab === 'flow'; }

    get kycTabClass()  { return this._tabClass('kyc');  }
    get loanTabClass() { return this._tabClass('loan'); }
    get flowTabClass() { return this._tabClass('flow'); }

    _tabClass(tab) {
        return `slds-tabs_default__item${this.activeTab === tab ? ' slds-is-active' : ''}`;
    }

    get isKycStep1() { return this.kycStep === 1; }
    get isKycStep2() { return this.kycStep === 2; }
    get isKycStep3() { return this.kycStep === 3; }
    get isKycStep4() { return this.kycStep === 4; }

    get isLoanStep1() { return this.loanStep === 1; }
    get isLoanStep2() { return this.loanStep === 2; }
    get isLoanStep3() { return this.loanStep === 3; }
    get isLoanStep4() { return this.loanStep === 4; }

    get kycSteps()  { return this._buildSteps(['Client Info', 'Documents', 'Risk', 'Decision'], this.kycStep); }
    get loanSteps() { return this._buildSteps(['Loan Terms', 'Financials', 'Collateral', 'Underwriting'], this.loanStep); }

    _buildSteps(labels, currentStep) {
        return labels.map((label, i) => {
            const num    = i + 1;
            const isDone = num < currentStep;
            const isActive = num === currentStep;
            return {
                id: num,
                number: num,
                label,
                isDone,
                isLast: num === labels.length,
                circleClass: `step-circle${isDone ? ' step-done' : isActive ? ' step-active' : ''}`,
                labelClass:  `step-label${isActive ? ' step-label-active' : isDone ? ' step-label-done' : ''}`,
                containerClass: 'step-item',
                connectorClass: `step-connector${isDone ? ' step-connector-done' : ''}`
            };
        });
    }

    // Risk getters
    get riskScoreClass() {
        const r = this.kyc.riskRating;
        if (r === 'High')   return 'risk-score-display risk-high';
        if (r === 'Medium') return 'risk-score-display risk-medium';
        return 'risk-score-display risk-low';
    }
    get riskRatingBadgeClass() {
        const r = this.kyc.riskRating;
        if (r === 'High')   return 'slds-badge badge-danger';
        if (r === 'Medium') return 'slds-badge badge-warning';
        return 'slds-badge badge-success';
    }
    get riskScoreInlineClass() {
        const r = this.kyc.riskRating;
        if (r === 'High')   return 'summary-value color-danger';
        if (r === 'Medium') return 'summary-value color-warning';
        return 'summary-value color-success';
    }

    // KYC decision banner
    get kycDecisionBannerClass() {
        const d = this.kyc.decision;
        if (!d) return '';
        if (d === 'Approved')       return 'decision-banner banner-success';
        if (d === 'Review Required') return 'decision-banner banner-warning';
        return 'decision-banner banner-danger';
    }
    get kycDecisionIcon() {
        const d = this.kyc.decision;
        if (d === 'Approved')       return 'utility:check';
        if (d === 'Review Required') return 'utility:priority';
        return 'utility:close';
    }

    // Loan getters
    get loanAmountFormatted() { return this._formatNumber(this.loan.amount); }
    get loanIncomeFormatted() { return this._formatNumber(this.loan.annualIncome); }

    get dtiClass() {
        const v = Number(this.loan.dtiRatio);
        if (v > 36) return 'summary-value color-danger';
        if (v > 28) return 'summary-value color-warning';
        return 'summary-value color-success';
    }
    get dtiBarClass() {
        const v = Number(this.loan.dtiRatio);
        if (v > 36) return 'gauge-fill gauge-fill-danger';
        if (v > 28) return 'gauge-fill gauge-fill-warning';
        return 'gauge-fill gauge-fill-success';
    }
    get dtiBarStyle() {
        return `width:${Math.min(Number(this.loan.dtiRatio), 100)}%`;
    }

    get ltvClass() {
        const v = Number(this.loan.ltvRatio);
        if (v > 80) return 'summary-value color-danger';
        if (v > 60) return 'summary-value color-warning';
        return 'summary-value color-success';
    }
    get ltvBarClass() {
        const v = Number(this.loan.ltvRatio);
        if (v > 80) return 'gauge-fill gauge-fill-danger';
        if (v > 60) return 'gauge-fill gauge-fill-warning';
        return 'gauge-fill gauge-fill-success';
    }
    get ltvBarStyle() {
        return `width:${Math.min(Number(this.loan.ltvRatio), 100)}%`;
    }

    get loanDecisionBannerClass() {
        const d = this.loan.decision;
        if (!d) return '';
        if (d === 'Approved')             return 'decision-banner banner-success';
        if (d === 'Conditionally Approved') return 'decision-banner banner-warning';
        return 'decision-banner banner-danger';
    }
    get loanDecisionIcon() {
        const d = this.loan.decision;
        if (d === 'Approved')             return 'utility:check';
        if (d === 'Conditionally Approved') return 'utility:priority';
        return 'utility:close';
    }

    // Activity
    get hasActivity()        { return this.activity.length > 0; }
    get activityCount()      { return this.activity.length; }
    get activityToggleIcon() { return this.showActivity ? 'utility:chevronup' : 'utility:chevrondown'; }

    // ─── Dropdown options ─────────────────────────────────────────────────
    get nationalityOptions() {
        return [
            { label: 'Dutch', value: 'Dutch' },
            { label: 'Belgian', value: 'Belgian' },
            { label: 'German', value: 'German' },
            { label: 'French', value: 'French' },
            { label: 'British', value: 'British' },
            { label: 'American', value: 'American' },
            { label: 'Other', value: 'Other' }
        ];
    }
    get clientTypeOptions() {
        return [
            { label: 'Retail', value: 'Retail' },
            { label: 'Private Banking', value: 'Private Banking' },
            { label: 'Corporate', value: 'Corporate' },
            { label: 'Institutional', value: 'Institutional' }
        ];
    }
    get docTypeOptions() {
        return [
            { label: 'Passport', value: 'Passport' },
            { label: 'National ID Card', value: 'National ID Card' },
            { label: 'Driving Licence', value: 'Driving Licence' },
            { label: 'Residence Permit', value: 'Residence Permit' }
        ];
    }
    get verificationStatusOptions() {
        return [
            { label: 'Pending', value: 'Pending' },
            { label: 'Verified', value: 'Verified' },
            { label: 'Failed', value: 'Failed' },
            { label: 'Manual Review', value: 'Manual Review' }
        ];
    }
    get pepStatusOptions() {
        return [
            { label: 'Not PEP', value: 'Not PEP' },
            { label: 'PEP', value: 'PEP' },
            { label: 'Related to PEP', value: 'Related to PEP' }
        ];
    }
    get sanctionsOptions() {
        return [
            { label: 'Clear', value: 'Clear' },
            { label: 'Match Found', value: 'Match Found' },
            { label: 'Possible Match', value: 'Possible Match' }
        ];
    }
    get sourceOfFundsOptions() {
        return [
            { label: 'Employment', value: 'Employment' },
            { label: 'Business Income', value: 'Business Income' },
            { label: 'Inheritance', value: 'Inheritance' },
            { label: 'Investment Returns', value: 'Investment Returns' },
            { label: 'Unknown / Other', value: 'Unknown / Other' }
        ];
    }
    get countryRiskOptions() {
        return [
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' }
        ];
    }
    get loanPurposeOptions() {
        return [
            { label: 'Mortgage – Primary Residence', value: 'Mortgage – Primary Residence' },
            { label: 'Mortgage – Investment Property', value: 'Mortgage – Investment Property' },
            { label: 'Business Expansion', value: 'Business Expansion' },
            { label: 'Debt Consolidation', value: 'Debt Consolidation' },
            { label: 'Vehicle Finance', value: 'Vehicle Finance' },
            { label: 'Personal Loan', value: 'Personal Loan' }
        ];
    }
    get loanTermOptions() {
        return [
            { label: '5 years',  value: '5'  },
            { label: '10 years', value: '10' },
            { label: '15 years', value: '15' },
            { label: '20 years', value: '20' },
            { label: '25 years', value: '25' },
            { label: '30 years', value: '30' }
        ];
    }
    get employmentOptions() {
        return [
            { label: 'Employed',    value: 'Employed'    },
            { label: 'Self-Employed', value: 'Self-Employed' },
            { label: 'Director',    value: 'Director'    },
            { label: 'Retired',     value: 'Retired'     },
            { label: 'Contractor',  value: 'Contractor'  }
        ];
    }
    get collateralOptions() {
        return [
            { label: 'Residential Property', value: 'Residential Property' },
            { label: 'Commercial Property',  value: 'Commercial Property'  },
            { label: 'Investment Portfolio',  value: 'Investment Portfolio'  },
            { label: 'Vehicle',              value: 'Vehicle'              },
            { label: 'None',                 value: 'None'                 }
        ];
    }

    // ─── Flow getters ─────────────────────────────────────────────────────
    get flowInputVariables() {
        const vars = [];
        if (this._clientName) {
            vars.push({ name: 'inputClientName', type: 'String', value: this._clientName });
        }
        if (this._dateOfBirth) {
            vars.push({ name: 'inputDateOfBirth', type: 'Date', value: this._dateOfBirth });
        }
        if (this._nationality) {
            vars.push({ name: 'inputNationality', type: 'String', value: this._nationality });
        }
        if (this._startDate) {
            vars.push({ name: 'inputStartDate', type: 'String', value: this._startDate });
        }
        return vars;
    }

    handleFlowStatusChange(evt) {
        const { status, outputVariables } = evt.detail;
        this._log('Flow status change', { status });
        if (status === 'FINISHED' || status === 'FINISHED_SCREEN') {
            const outputs = {};
            if (outputVariables) {
                outputVariables.forEach(v => { outputs[v.name] = v.value; });
            }
            const payload = JSON.parse(JSON.stringify({
                process:     'kyc_onboarding_flow',
                clientId:    this._clientId || null,
                clientName:  outputs.outputClientName || null,
                riskRating:  outputs.outputRiskRating || null,
                decision:    outputs.outputDecision || null,
                completedAt: new Date().toISOString()
            }));
            this.flowResultNote = `${payload.clientName || 'Client'} — ${payload.decision || 'No decision'} · Risk: ${payload.riskRating || 'Unknown'}`;
            this.flowFinished = true;
            this._log('Flow completed — sending to chat', payload);
            this.dispatchEvent(new CustomEvent('kyc_completed', {
                detail: JSON.stringify(payload),
                bubbles: true,
                composed: true
            }));
        }
        if (status === 'ERROR') {
            this._log('Flow error', evt.detail);
        }
    }

    handleFlowReset() {
        this.flowFinished   = false;
        this.flowResultNote = '';
    }

    // ─── Tab handlers ─────────────────────────────────────────────────────
    handleTabKyc()  { this.activeTab = 'kyc';  }
    handleTabLoan() { this.activeTab = 'loan'; }
    handleTabFlow() { this.activeTab = 'flow'; }

    // ─── KYC handlers ─────────────────────────────────────────────────────
    handleKycField(evt) {
        const field = evt.target.dataset.field;
        this.kyc = { ...this.kyc, [field]: evt.detail.value };
    }

    handleKycRiskChange(evt) {
        const field = evt.target.dataset.field;
        const updated = { ...this.kyc, [field]: evt.detail.value };
        this.kyc = { ...updated, ...this._calcRiskScore(updated) };
    }

    handleKycNext() {
        if (this.kycStep < 4) this.kycStep += 1;
        if (this.kycStep === 3) {
            this.kyc = { ...this.kyc, ...this._calcRiskScore(this.kyc) };
        }
        this._log(`KYC advanced to step ${this.kycStep}`, this._kycSummary());
    }
    handleKycBack() {
        if (this.kycStep > 1) this.kycStep -= 1;
    }

    handleKycApprove() {
        this.kyc = {
            ...this.kyc,
            decision: 'Approved',
            decisionNote: `Client onboarding approved on ${TODAY}. Risk rating: ${this.kyc.riskRating}. All compliance checks passed.`
        };
        this._log('KYC decision: Approved', this._kycSummary());
    }
    handleKycReview() {
        this.kyc = {
            ...this.kyc,
            decision: 'Review Required',
            decisionNote: 'Additional documentation or enhanced due diligence required before onboarding can proceed.'
        };
        this._log('KYC decision: Review Required', this._kycSummary());
    }
    handleKycReject() {
        this.kyc = {
            ...this.kyc,
            decision: 'Rejected',
            decisionNote: 'Client onboarding rejected. Risk profile does not meet compliance requirements.'
        };
        this._log('KYC decision: Rejected', this._kycSummary());
    }

    handleKycSendToChat() {
        const payload = JSON.parse(JSON.stringify({
            process: 'kyc_onboarding',
            clientId:    this._clientId || null,
            clientName:  this.kyc.clientName,
            clientType:  this.kyc.clientType,
            nationality: this.kyc.nationality,
            riskScore:   this.kyc.riskScore,
            riskRating:  this.kyc.riskRating,
            pepStatus:   this.kyc.pepStatus,
            sanctionsCheck: this.kyc.sanctionsCheck,
            decision:    this.kyc.decision,
            decisionNote: this.kyc.decisionNote,
            completedAt: new Date().toISOString()
        }));
        this._log('Sending KYC result to chat', payload);
        this.dispatchEvent(new CustomEvent('kyc_completed', {
            detail: JSON.stringify(payload),
            bubbles: true,
            composed: true
        }));
    }

    handleKycReset() {
        this.kyc     = KYC_DEFAULTS();
        this.kycStep = 1;
        if (this._clientName) this.kyc = { ...this.kyc, clientName: this._clientName };
        if (this._startDate)  this.kyc = { ...this.kyc, startDate: this._startDate };
    }

    // ─── Loan handlers ────────────────────────────────────────────────────
    handleLoanField(evt) {
        const field = evt.target.dataset.field;
        this.loan = { ...this.loan, [field]: evt.detail.value };
    }

    handleLoanFinancialChange(evt) {
        const field   = evt.target.dataset.field;
        const updated = { ...this.loan, [field]: evt.detail.value };
        this.loan = { ...updated, ...this._calcLoanMetrics(updated) };
    }

    handleLoanCollateralChange(evt) {
        const field   = evt.target.dataset.field;
        const updated = { ...this.loan, [field]: evt.detail.value };
        this.loan = { ...updated, ...this._calcLoanMetrics(updated) };
    }

    handleLoanNext() {
        if (this.loanStep < 4) this.loanStep += 1;
        if (this.loanStep === 4) {
            this.loan = { ...this.loan, ...this._calcLoanMetrics(this.loan) };
        }
        this._log(`Loan advanced to step ${this.loanStep}`, this._loanSummary());
    }
    handleLoanBack() {
        if (this.loanStep > 1) this.loanStep -= 1;
    }

    handleLoanApprove() {
        this.loan = {
            ...this.loan,
            decision: 'Approved',
            decisionNote: `Loan approved at ${this.loan.suggestedRate}% p.a. for ${this.loan.termYears} years. Monthly instalment estimate: €${this._calcMonthlyPayment()}.`
        };
        this._log('Loan decision: Approved', this._loanSummary());
    }
    handleLoanConditional() {
        this.loan = {
            ...this.loan,
            decision: 'Conditionally Approved',
            decisionNote: `Conditional approval subject to: additional income documentation, satisfactory property valuation, and life insurance assignment.`
        };
        this._log('Loan decision: Conditional', this._loanSummary());
    }
    handleLoanDecline() {
        this.loan = {
            ...this.loan,
            decision: 'Declined',
            decisionNote: `Application declined. Debt-to-income ratio (${this.loan.dtiRatio}%) exceeds acceptable threshold or credit score is insufficient.`
        };
        this._log('Loan decision: Declined', this._loanSummary());
    }

    handleLoanSendToChat() {
        const payload = JSON.parse(JSON.stringify({
            process: 'loan_application',
            clientId:         this._clientId || null,
            applicantName:    this.loan.applicantName,
            loanAmount:       this.loan.amount,
            purpose:          this.loan.purpose,
            termYears:        this.loan.termYears,
            suggestedRate:    this.loan.suggestedRate,
            dtiRatio:         this.loan.dtiRatio,
            ltvRatio:         this.loan.ltvRatio,
            creditScore:      this.loan.creditScore,
            decision:         this.loan.decision,
            decisionNote:     this.loan.decisionNote,
            completedAt:      new Date().toISOString()
        }));
        this._log('Sending loan result to chat', payload);
        this.dispatchEvent(new CustomEvent('loan_decision', {
            detail: JSON.stringify(payload),
            bubbles: true,
            composed: true
        }));
    }

    handleLoanReset() {
        this.loan     = LOAN_DEFAULTS();
        this.loanStep = 1;
        if (this._clientName) this.loan = { ...this.loan, applicantName: this._clientName };
        if (this._loanAmount) this.loan = { ...this.loan, amount: this._loanAmount };
        if (this._startDate)  this.loan = { ...this.loan, applicationDate: this._startDate };
    }

    // ─── Activity log ─────────────────────────────────────────────────────
    handleToggleActivity() { this.showActivity = !this.showActivity; }

    // ─── Calculation helpers ───────────────────────────────────────────────
    _calcRiskScore(data) {
        let score = 10;
        if (data.pepStatus === 'PEP')                  score += 40;
        else if (data.pepStatus === 'Related to PEP')  score += 20;
        if (data.sanctionsCheck === 'Match Found')     score += 50;
        else if (data.sanctionsCheck === 'Possible Match') score += 25;
        if (data.countryRisk === 'High')   score += 20;
        else if (data.countryRisk === 'Medium') score += 10;
        if (data.sourceOfFunds === 'Unknown / Other')  score += 15;
        if (data.docVerificationStatus === 'Failed')   score += 20;
        score = Math.min(score, 100);
        let riskRating;
        if (score >= 60)      riskRating = 'High';
        else if (score >= 30) riskRating = 'Medium';
        else                  riskRating = 'Low';
        return { riskScore: score, riskRating };
    }

    _calcLoanMetrics(data) {
        const amount      = Number(data.amount) || 0;
        const income      = Number(data.annualIncome) || 0;
        const debt        = Number(data.existingDebt) || 0;
        const colValue    = Number(data.collateralValue) || 0;
        const creditScore = Number(data.creditScore) || 650;
        const termYears   = Number(data.termYears) || 20;

        // DTI: (monthly payment estimate + existing debt) / monthly income
        const monthlyIncome = income / 12;
        const baseRate = 4.5;
        const monthlyRate = baseRate / 100 / 12;
        const nPayments = termYears * 12;
        let monthlyPayment = 0;
        if (monthlyRate > 0 && nPayments > 0 && amount > 0) {
            monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)
                           / (Math.pow(1 + monthlyRate, nPayments) - 1);
        }
        const dtiRatio = monthlyIncome > 0
            ? Math.round(((monthlyPayment + debt) / monthlyIncome) * 100)
            : null;

        // LTV
        const ltvRatio = colValue > 0
            ? Math.round((amount / colValue) * 100)
            : null;

        // Suggested rate based on credit score, DTI, LTV
        let suggestedRate = 4.5;
        if (creditScore >= 750) suggestedRate -= 0.5;
        else if (creditScore < 600) suggestedRate += 1.5;
        else if (creditScore < 650) suggestedRate += 0.75;
        if (dtiRatio > 36) suggestedRate += 0.5;
        if (ltvRatio > 80) suggestedRate += 0.75;
        suggestedRate = Math.max(1.5, Math.round(suggestedRate * 10) / 10);

        return { dtiRatio, ltvRatio, suggestedRate };
    }

    _calcMonthlyPayment() {
        const amount = Number(this.loan.amount) || 0;
        const rate   = Number(this.loan.suggestedRate) / 100 / 12;
        const n      = Number(this.loan.termYears) * 12;
        if (!amount || !rate || !n) return '0';
        const mp = amount * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1);
        return this._formatNumber(Math.round(mp));
    }

    _kycSummary() {
        return {
            clientName:  this.kyc.clientName,
            riskScore:   this.kyc.riskScore,
            riskRating:  this.kyc.riskRating,
            decision:    this.kyc.decision
        };
    }

    _loanSummary() {
        return {
            applicant:  this.loan.applicantName,
            amount:     this.loan.amount,
            dtiRatio:   this.loan.dtiRatio,
            ltvRatio:   this.loan.ltvRatio,
            suggestedRate: this.loan.suggestedRate,
            decision:   this.loan.decision
        };
    }

    // ─── Utility ──────────────────────────────────────────────────────────
    _parseScalar(value, fallback) {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'object') {
            try { return JSON.parse(JSON.stringify(value)) || fallback; }
            catch { return fallback; }
        }
        return String(value) || fallback;
    }

    _formatNumber(n) {
        return Number(n).toLocaleString('nl-NL');
    }

    _log(label, value) {
        const now  = new Date();
        const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        this.activity = [{
            id:     now.getTime(),
            time,
            label,
            detail: JSON.stringify(value, null, 2)
        }, ...this.activity.slice(0, 19)];
    }
}
