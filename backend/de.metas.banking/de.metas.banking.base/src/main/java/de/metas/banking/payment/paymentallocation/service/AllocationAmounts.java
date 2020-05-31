package de.metas.banking.payment.paymentallocation.service;

import java.util.Objects;

import javax.annotation.Nullable;

import org.adempiere.exceptions.AdempiereException;

import com.google.common.base.MoreObjects;

import de.metas.money.CurrencyId;
import de.metas.money.Money;
import de.metas.util.lang.CoalesceUtil;
import lombok.Builder;
import lombok.NonNull;
import lombok.Value;

/*
 * #%L
 * de.metas.banking.swingui
 * %%
 * Copyright (C) 2019 metas GmbH
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program. If not, see
 * <http://www.gnu.org/licenses/gpl-2.0.html>.
 * #L%
 */

@Value
public class AllocationAmounts
{
	public static AllocationAmounts zero(@NonNull final CurrencyId currencyId)
	{
		final Money zero = Money.zero(currencyId);
		return builder()
				.payAmt(zero)
				.discountAmt(zero)
				.writeOffAmt(zero)
				.build();
	}

	public static AllocationAmounts ofPayAmt(@NonNull final Money payAmt)
	{
		return builder().payAmt(payAmt).build();
	}

	private final CurrencyId currencyId;
	private final Money payAmt;
	private final Money discountAmt;
	private final Money writeOffAmt;
	private final Money invoiceProcessingFee;
	private final Money bankFeeAmt;

	@Builder(toBuilder = true)
	private AllocationAmounts(
			@Nullable final Money payAmt,
			@Nullable final Money discountAmt,
			@Nullable final Money writeOffAmt,
			@Nullable final Money invoiceProcessingFee,
			@Nullable final Money bankFeeAmt)
	{
		final Money firstNonNull = CoalesceUtil.coalesce(payAmt, discountAmt, writeOffAmt, invoiceProcessingFee, bankFeeAmt);
		if (firstNonNull == null)
		{
			throw new AdempiereException("Provide at least one amount. If you want o create a ZERO instance, use the zero(currencyId) method.");
		}
		final Money zero = firstNonNull.toZero();

		this.payAmt = payAmt != null ? payAmt : zero;
		this.discountAmt = discountAmt != null ? discountAmt : zero;
		this.writeOffAmt = writeOffAmt != null ? writeOffAmt : zero;
		this.invoiceProcessingFee = invoiceProcessingFee != null ? invoiceProcessingFee : zero;
		this.bankFeeAmt = bankFeeAmt != null ? bankFeeAmt : zero;

		this.currencyId = Money.getCommonCurrencyIdOfAll(
				this.payAmt,
				this.discountAmt,
				this.writeOffAmt,
				this.invoiceProcessingFee,
				this.bankFeeAmt);
	}

	@Override
	public String toString()
	{
		return MoreObjects.toStringHelper(this)
				.omitNullValues()
				.add("currencyId", currencyId.getRepoId())
				.add("payAmt", payAmt != null ? payAmt.toBigDecimal() : null)
				.add("discountAmt", discountAmt != null ? discountAmt.toBigDecimal() : null)
				.add("writeOffAmt", writeOffAmt != null ? writeOffAmt.toBigDecimal() : null)
				.add("invoiceProcessingFee", invoiceProcessingFee != null ? invoiceProcessingFee.toBigDecimal() : null)
				.add("bankFeeAmt", bankFeeAmt != null ? bankFeeAmt.toBigDecimal() : null)
				.toString();
	}

	public AllocationAmounts addPayAmt(@NonNull final Money payAmtToAdd)
	{
		final Money newPayAmt = this.payAmt.add(payAmtToAdd);
		return withPayAmt(newPayAmt);
	}

	public AllocationAmounts withPayAmt(@NonNull final Money payAmt)
	{
		return Objects.equals(this.payAmt, payAmt)
				? this
				: toBuilder().payAmt(payAmt).build();
	}

	public AllocationAmounts withZeroPayAmt()
	{
		return withPayAmt(payAmt.toZero());
	}

	public AllocationAmounts addDiscountAmt(@NonNull final Money discountAmtToAdd)
	{
		final Money newDiscountAmt = this.discountAmt.add(discountAmtToAdd);
		return withDiscountAmt(newDiscountAmt);
	}

	public AllocationAmounts withDiscountAmt(@NonNull final Money discountAmt)
	{
		return Objects.equals(this.discountAmt, discountAmt)
				? this
				: toBuilder().discountAmt(discountAmt).build();
	}

	public AllocationAmounts addWriteOffAmt(@NonNull final Money writeOffAmtToAdd)
	{
		final Money newWriteOffAmt = this.writeOffAmt.add(writeOffAmtToAdd);
		return withWriteOffAmt(newWriteOffAmt);
	}

	public AllocationAmounts withWriteOffAmt(@NonNull final Money writeOffAmt)
	{
		return Objects.equals(this.writeOffAmt, writeOffAmt)
				? this
				: toBuilder().writeOffAmt(writeOffAmt).build();
	}

	public AllocationAmounts withInvoiceProcessingFee(@NonNull final Money invoiceProcessingFee)
	{
		return Objects.equals(this.invoiceProcessingFee, invoiceProcessingFee)
				? this
				: toBuilder().invoiceProcessingFee(invoiceProcessingFee).build();
	}

	public AllocationAmounts withBankFeeAmt(@NonNull final Money bankFeeAmt)
	{
		return Objects.equals(this.bankFeeAmt, bankFeeAmt)
				? this
				: toBuilder().bankFeeAmt(bankFeeAmt).build();
	}

	public AllocationAmounts movePayAmtToDiscount()
	{
		if (payAmt.signum() == 0)
		{
			return this;
		}
		else
		{
			return toBuilder()
					.payAmt(payAmt.toZero())
					.discountAmt(discountAmt.add(payAmt))
					.build();
		}
	}

	public AllocationAmounts movePayAmtToWriteOff()
	{
		if (payAmt.signum() == 0)
		{
			return this;
		}
		else
		{
			return toBuilder()
					.payAmt(payAmt.toZero())
					.writeOffAmt(writeOffAmt.add(payAmt))
					.build();
		}
	}

	public AllocationAmounts add(AllocationAmounts other)
	{
		return toBuilder()
				.payAmt(this.payAmt.add(other.payAmt))
				.discountAmt(this.discountAmt.add(other.discountAmt))
				.writeOffAmt(this.writeOffAmt.add(other.writeOffAmt))
				.invoiceProcessingFee(this.invoiceProcessingFee.add(other.invoiceProcessingFee))
				.bankFeeAmt(this.bankFeeAmt.add(other.bankFeeAmt))
				.build();
	}

	public AllocationAmounts subtract(AllocationAmounts other)
	{
		return toBuilder()
				.payAmt(this.payAmt.subtract(other.payAmt))
				.discountAmt(this.discountAmt.subtract(other.discountAmt))
				.writeOffAmt(this.writeOffAmt.subtract(other.writeOffAmt))
				.invoiceProcessingFee(this.invoiceProcessingFee.subtract(other.invoiceProcessingFee))
				.bankFeeAmt(this.bankFeeAmt.subtract(other.bankFeeAmt))
				.build();
	}

	public AllocationAmounts negateIf(final boolean condition)
	{
		return condition ? negate() : this;
	}

	public AllocationAmounts negate()
	{
		if (isZero())
		{
			return this;
		}

		return toBuilder()
				.payAmt(this.payAmt.negate())
				.discountAmt(this.discountAmt.negate())
				.writeOffAmt(this.writeOffAmt.negate())
				.invoiceProcessingFee(this.invoiceProcessingFee.negate())
				.bankFeeAmt(this.bankFeeAmt.negate())
				.build();
	}

	public Money getTotalAmt()
	{
		return payAmt.add(discountAmt).add(writeOffAmt).add(invoiceProcessingFee).add(bankFeeAmt);
	}

	public boolean isZero()
	{
		return payAmt.signum() == 0
				&& discountAmt.signum() == 0
				&& writeOffAmt.signum() == 0
				&& invoiceProcessingFee.signum() == 0
				&& bankFeeAmt.signum() == 0;
	}

	public AllocationAmounts toZero()
	{
		return isZero() ? this : AllocationAmounts.zero(getCurrencyId());
	}
}
