 pragma solidity ^ 0.4 .16;

      /**
       * @title SafeMath
       * @dev Math operations with safety checks that throw on error
       */
      library SafeMath {

        function mul(uint256 a, uint256 b) internal constant returns(uint256) {
          uint256 c = a * b;
          assert(a == 0 || c / a == b);
          return c;
        }

        function div(uint256 a, uint256 b) internal constant returns(uint256) {
          // assert(b > 0); // Solidity automatically throws when dividing by 0
          uint256 c = a / b;
          // assert(a == b * c + a % b); // There is no case in which this doesn't hold
          return c;
        }

        function sub(uint256 a, uint256 b) internal constant returns(uint256) {
          assert(b <= a);
          return a - b;
        }

        function add(uint256 a, uint256 b) internal constant returns(uint256) {
          uint256 c = a + b;
          assert(c >= a);
          return c;
        }

      }

      contract ProjectInterface {
        function totalSupply() public view returns(uint256);

        function balanceOf(address _who) public view returns(uint256);

        function allowance(address _owner, address _spender)
        public view returns(uint256);

        function transfer(address _to, uint256 _value) public returns(bool);

        function approve(address _spender, uint256 _value)
        public returns(bool);

        function transferFrom(address _from, address _to, uint256 _value)
        public returns(bool);

        event Transfer(
          address indexed from,
          address indexed to,
          uint256 value
        );

        event Approval(
          address indexed owner,
          address indexed spender,
          uint256 value
        );
      }

      contract InvestPool {

        using SafeMath
        for uint256;

        address public icoWorldAddress;

        address public projectAddress;

        uint256 public maxTotalAmount;

        uint256 public minTotalAmount;

        uint256 public maxTotalAmountForOne;

        uint256 public minTotalAmountForOne;

        uint256 public poolCommision;

        uint256 public icoWorldCommision;

        address public poolOwner;

        uint256 public start;

        uint256 public period;

        uint256 public criticalDate;

        bool public isInvest = false;

        mapping(address => uint256) public investments;

        address[] public addresses;

        uint256 public balance;

        uint256 public tokenBalance;

        modifier onlyOwner() {
          require(msg.sender == poolOwner);
          _;
        }

        constructor(address _projectAddress,
          uint256 _maxTotalAmount,
          uint256 _minTotalAmount,
          uint256 _maxTotalAmountForOne,
          uint256 _minTotalAmountForOne,
          uint256 _poolCommision,
          uint256 _icoWorldCommision,
          address _poolOwner,
          uint256 _start,
          uint256 _period,
          uint256 _criticalDate) public {
          icoWorldAddress = msg.sender;
          projectAddress = _projectAddress;
          maxTotalAmount = _maxTotalAmount;
          minTotalAmount = _minTotalAmount;
          maxTotalAmountForOne = _maxTotalAmountForOne;
          minTotalAmountForOne = _minTotalAmountForOne;
          poolCommision = _poolCommision;
          icoWorldCommision = _icoWorldCommision;
          poolOwner = _poolOwner;
          start = _start;
          period = _period;
          criticalDate = _criticalDate;
          ProjectInterface ProjectContract = ProjectInterface(_projectAddress);
        }

        /**
         * @dev Function to send eth to the smart contract.
         */
        function () external payable {
          require(now > start && now < start + period * 24 * 60 * 60 && (balance + msg.value) <= maxTotalAmount && msg.value >= minTotalAmountForOne && msg.value <= maxTotalAmountForOne);
          investments[msg.sender] = investments[msg.sender].add(msg.value);
          addresses.push(msg.sender);
          balance = balance.add(msg.value);
        }

        /**
         * @dev Function to check the amount of investment.
         * @param _address Investor's address.
         * @return A uint256 specifing the amount of investment.
         */
        function getData(address _address) public view returns(uint256) {
          require(_address == msg.sender);
          return investments[_address];
        }

        /**
         * @dev Function to get address by number.
         * @param _number number.
         * @return address by number.
         */
        function getAddressByNumber(uint256 _number) public view returns(address) {
          return addresses[_number];
        }


        /**
         * @dev Function to get the poolCommision.
         * @return A uint256 poolCommision.
         */
        function getPoolCommision() public view returns(uint256) {
          return poolCommision;
        }

        function getIsInvest() public view returns(bool) {
          return isInvest;
        }


        /**
         * @dev Function for owner to send eth to the project.
         * @return A bool specifing the result.
         */
        function investProject() public onlyOwner payable returns(bool) {
          require((now > start + period * 24 * 60 * 60) && (now < criticalDate) && (address(this).balance >= minTotalAmount));
          icoWorldAddress.transfer(address(this).balance.mul(icoWorldCommision).div(100));
          projectAddress.transfer(address(this).balance);
          //tokenBalance = ProjectContract.balanceOf(address(this));
          isInvest = true;
        }

        /**
         * @dev Function for investors to get the tokens.
         * @return A bool specifing the result.
         */
        function getTokens() public returns(bool) {
          uint256 value = (1 - poolCommision.div(100)).mul(tokenBalance).mul(investments[msg.sender].div(balance));
          investments[msg.sender] = 0;
          projectAddress.transfer(value);
        }

        /**
         * @dev Function for investors to return the invested eth (after a critical date in case the money was not sent in the project).
         * @return A bool specifing the result.
         */
        function refund() public returns(bool) {
          require(now > criticalDate && !(isInvest));
          uint256 value = investments[msg.sender];
          investments[msg.sender] = 0;
          msg.sender.transfer(value);
        }
      }