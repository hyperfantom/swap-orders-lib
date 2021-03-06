/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GelatoLimitOrders, utils } from "@gelatonetwork/limit-orders-lib";
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";
import { CurrencyAmount, BigintIsh } from "@uniswap/sdk-core";
import { formatUnits } from "@ethersproject/units";
import React, { useState, useMemo } from "react";
import { useGelatoRangeOrders } from "../../hooks/gelato";
import useGelatoRangeOrdersLib from "../../hooks/gelato/useGelatoRangeOrdersLib";
import useGasOverhead from "../../hooks/useGasOverhead";
import useTheme from "../../hooks/useTheme";
import { Rate } from "../../state/gorder/actions";
import { TYPE } from "../../theme";
import { useWeb3 } from "../../web3";
import { AutoColumn } from "../Column";
import { RowBetween, RowFixed } from "../Row";
import { MouseoverTooltip } from "../Tooltip";
import { BigNumber } from "ethers";

export function AdvancedSwapDetails() {
  const theme = useTheme();
  const { chainId } = useWeb3();
  const {
    derivedOrderInfo: { parsedAmounts, rawAmounts },
    orderState: { rateType },
  } = useGelatoRangeOrders();

  const library = useGelatoRangeOrdersLib();
  const [minReturnRaw, setMinReturn] = useState<BigintIsh>(0);

  const { gasPrice, realExecutionPriceAsString } = useGasOverhead(
    parsedAmounts.input,
    parsedAmounts.output,
    rateType
  );

  const isInvertedRate = rateType === Rate.DIV;

  const realExecutionRateWithSymbols = useMemo(
    () =>
      parsedAmounts.input?.currency &&
      parsedAmounts.output?.currency &&
      realExecutionPriceAsString
        ? realExecutionPriceAsString === "never executes"
          ? realExecutionPriceAsString
          : `1 ${
              isInvertedRate
                ? parsedAmounts.output.currency.symbol
                : parsedAmounts.input.currency.symbol
            } = ${realExecutionPriceAsString} ${
              isInvertedRate
                ? parsedAmounts.input.currency.symbol
                : parsedAmounts.output.currency.symbol
            }`
        : undefined,
    [parsedAmounts, realExecutionPriceAsString, isInvertedRate]
  );

  const outputAmount = parsedAmounts.output;

  const rawOutputAmount = rawAmounts.output ?? "0";

  const { minReturn, slippagePercentage, gelatoFeePercentage } = useMemo(() => {
    if (!outputAmount || !library || !chainId)
      return {
        minReturn: undefined,
        slippagePercentage: undefined,
        gelatoFeePercentage: undefined,
      };

    if (utils.isEthereumChain(chainId))
      return {
        minReturn: outputAmount,
        slippagePercentage: undefined,
        gelatoFeePercentage: undefined,
      };
    // async () => {
    //   const mr = await library.getMinReturn({
    //     pool: "0x0000000000000000000000000000000000000000",
    //     zeroForOne: true,
    //     tickThreshold: 0,
    //     amountIn: BigNumber.from(0),
    //     receiver: "0x0000000000000000000000000000000000000000",
    //     maxFeeAmount: BigNumber.from(0),
    //   });
    //   setMinReturn(mr.toString());
    // };

    const slippagePercentage = GelatoLimitOrders.slippageBPS / 100;
    const gelatoFeePercentage = GelatoLimitOrders.gelatoFeeBPS / 100;

    const minReturnParsed = CurrencyAmount.fromRawAmount(
      outputAmount.currency,
      minReturnRaw
    );

    return {
      minReturn: minReturnParsed,
      slippagePercentage,
      gelatoFeePercentage,
    };
  }, [outputAmount, library, chainId, minReturnRaw]);

  return !chainId ? null : (
    <AutoColumn gap="8px">
      {!isEthereumChain(chainId) ? (
        <>
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
                Gelato Fee
              </TYPE.black>
            </RowFixed>
            <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
              {gelatoFeePercentage ? `${gelatoFeePercentage}` : "-"}%
            </TYPE.black>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
                Slippage
              </TYPE.black>
            </RowFixed>
            <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
              {slippagePercentage ? `${slippagePercentage}` : "-"}%
            </TYPE.black>
          </RowBetween>
        </>
      ) : (
        <>
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
                Gas Price
              </TYPE.black>
            </RowFixed>
            <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
              {gasPrice
                ? `${parseFloat(formatUnits(gasPrice, "gwei")).toFixed(0)} GWEI`
                : "-"}
            </TYPE.black>
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <MouseoverTooltip
                text={`The actual execution price. Takes into account the gas necessary to execute your order and guarantees that your desired rate is fulfilled. It fluctuates according to gas prices. ${
                  realExecutionRateWithSymbols
                    ? `Assuming current gas price it should execute when ` +
                      realExecutionRateWithSymbols +
                      "."
                    : ""
                }`}
              >
                <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
                  Real Execution Price (?)
                </TYPE.black>{" "}
              </MouseoverTooltip>
            </RowFixed>
            <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
              {realExecutionRateWithSymbols
                ? `${realExecutionRateWithSymbols}`
                : "-"}
            </TYPE.black>
          </RowBetween>
        </>
      )}

      <RowBetween>
        <RowFixed>
          <MouseoverTooltip
            text={`The minimum amount you can receive. It includes all fees and maximum slippage tolerance.`}
          >
            <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
              Minimum Received (?)
            </TYPE.black>
          </MouseoverTooltip>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {minReturn
            ? `${minReturn.toSignificant(4)} ${
                outputAmount ? outputAmount.currency.symbol : "-"
              }`
            : "-"}
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  );
}
