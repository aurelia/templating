interface CompositionTransactionOwnershipToken {
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
  * Attempt to take ownership of the composition transaction.
  * @return An ownership token if successful, otherwise null.
  */
  tryCapture(): CompositionTransactionOwnershipToken {
    if (this._ownershipToken !== null) {
      return null;
    }

    return (this._ownershipToken = this._createOwnershipToken());
  }

  /**
  * Enlist an async render operation into the transaction.
  * @return A completion notifier.
  */
  enlist(): CompositionTransactionNotifier {
    let that = this;

    that._compositionCount++;

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
    let token = {};
    let promise = new Promise((resolve, reject) => {
      token._resolve = resolve;
    });

    token.waitForCompositionComplete = () => {
      this._tryCompleteTransaction();
      return promise;
    };

    return token;
  }
}
