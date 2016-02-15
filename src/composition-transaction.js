
interface CompositionTransactionOwnershipToken {
  compositionInProcess: boolean;
  waitForCompositionComplete(): Promise<void>;
}

interface CompositionTransactionNotifier {
  done(): void;
}

/**
* Enables an initiator of a view composition to track any internal async rendering processes for completion.
*/
export class CompositionTransaction {
  /**
  * Creates an instance of CompositionTransaction.
  */
  constructor() {
    this._ownershipToken = null;
    this._compositionCount = 0;
  }
  
  /**
  * Indicates whether or not the current composition transation has an owner.
  */
  get hasOwner(): boolean {
    return this._ownershipToken !== null;
  }
  
  /**
  * Attempt to take ownership of the composition transation.
  * @return An ownership token if successful, otherwise null.
  */
  tryCapture(): CompositionTransactionOwnershipToken {
    if (this._ownershipToken !== null) {
      return null;
    }  
    
    return this._ownershipToken = this._createOwnershipToken();
  }
  
  /**
  * Enlist an async render operation into the transaction.
  * @return A completion notifier.
  */
  enlist(): CompositionTransactionNotifier {
    let that = this;
    
    that._compositionCount++;
    
    if (this._ownershipToken !== null) {
      this._ownershipToken.compositionInProcess = true;
    }
    
    return {
      done() {
        that._compositionCount--;
        that._tryCompleteTransaction();
      }
    };
  }
  
  _tryCompleteTransaction() {
    if (this._compositionCount <= 0) {
      this._compositionCount = 0;
      
      if (this._ownershipToken !== null) {
        let capture = this._ownershipToken;
        this._ownershipToken = null;
        capture._resolve();
      }
    }
  }
  
  _createOwnershipToken(): CompositionTransactionOwnershipToken {
    let token = {compositionInProcess: this._compositionCount > 0};
    let promise = new Promise((resolve, reject) => {
      token._resolve = resolve;
    });
    
    token.waitForCompositionComplete = function() {
      return promise;
    };
    
    return token;
  }
}