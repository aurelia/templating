/**
* A mechanism by which an enlisted async render operation can notify the owning transaction when its work is done.
*/
export class CompositionTransactionNotifier {
  constructor(owner) {
    this.owner = owner;
    this.owner._compositionCount++;
  }

  /**
  * Notifies the owning transaction that its work is done.
  */
  done(): void {
    this.owner._compositionCount--;
    this.owner._tryCompleteTransaction();
  }
}

/**
* Referenced by the subsytem which wishes to control a composition transaction.
*/
export class CompositionTransactionOwnershipToken {
  constructor(owner) {
    this.owner = owner;
    this.owner._ownershipToken = this;
    this.thenable = this._createThenable();
  }

  /**
  * Allows the transaction owner to wait for the completion of all child compositions.
  * @return A promise that resolves when all child compositions are done.
  */
  waitForCompositionComplete(): Promise<void> {
    this.owner._tryCompleteTransaction();
    return this.thenable;
  }

  /**
  * Used internall to resolve the composition complete promise.
  */
  resolve(): void {
    this._resolveCallback();
  }

  _createThenable() {
    return new Promise((resolve, reject) => {
      this._resolveCallback = resolve;
    });
  }
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
    return this._ownershipToken === null
      ? new CompositionTransactionOwnershipToken(this)
      : null;
  }

  /**
  * Enlist an async render operation into the transaction.
  * @return A completion notifier.
  */
  enlist(): CompositionTransactionNotifier {
    return new CompositionTransactionNotifier(this);
  }

  _tryCompleteTransaction() {
    if (this._compositionCount <= 0) {
      this._compositionCount = 0;

      if (this._ownershipToken !== null) {
        let token = this._ownershipToken;
        this._ownershipToken = null;
        token.resolve();
      }
    }
  }
}
