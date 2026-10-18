/**
 * EDITABLE STORE INFORMATION
 * These entries populate the footer help dialogs and the product size guide.
 * The key (story, sizes, care, delivery, payments) matches data-info in the HTML.
 * Use trusted, author-written HTML here; customer input must never be inserted.
 */

export const information = {
  story: {
    title: 'The AURÉL point of view.',
    body: /* HTML */ `<p>
        Everyday, elevated. AURÉL is a contemporary clothing concept built around a simple idea:
        good style should feel like yourself.
      </p>
      <p>
        Our collection brings together easy essentials, considered tailoring, modern festive wear,
        and little pieces for big childhood adventures. The palette is quiet, the shapes are
        versatile, and the possibilities are yours.
      </p>
      <h3>A wardrobe for every chapter</h3>
      <p>
        Explore 18 women’s pieces, 18 men’s pieces, and 18 children’s pieces. Choose by size,
        colour, or the occasion you are dressing for.
      </p>
      <h3>A new story, taking shape</h3>
      <p>
        This is a concept storefront with original campaign and product concept imagery. Products,
        prices, fabric descriptions, and availability are illustrative. Purchasing will become
        available after the catalogue, business information, and payment setup are confirmed.
      </p>`,
  },
  sizes: {
    title: 'Find your fit.',
    body: /* HTML */ `<p>
        A starting point for choosing a size. These are illustrative body-measurement guides, not
        verified garment specifications. Final product measurements will be confirmed before
        ordering is enabled.
      </p>
      <h3>Women — body measurements in inches</h3>
      <div class="table-wrap">
        <table class="size-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Bust</th>
              <th>Waist</th>
              <th>Hip</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>XS</td>
              <td>32–33</td>
              <td>25–26</td>
              <td>35–36</td>
            </tr>
            <tr>
              <td>S</td>
              <td>34–35</td>
              <td>27–28</td>
              <td>37–38</td>
            </tr>
            <tr>
              <td>M</td>
              <td>36–37</td>
              <td>29–30</td>
              <td>39–40</td>
            </tr>
            <tr>
              <td>L</td>
              <td>38–40</td>
              <td>31–33</td>
              <td>41–43</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>41–43</td>
              <td>34–36</td>
              <td>44–46</td>
            </tr>
            <tr>
              <td>XXL</td>
              <td>44–46</td>
              <td>37–39</td>
              <td>47–49</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Men — body measurements in inches</h3>
      <div class="table-wrap">
        <table class="size-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest</th>
              <th>Waist</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>XS</td>
              <td>34–35</td>
              <td>28–29</td>
            </tr>
            <tr>
              <td>S</td>
              <td>36–37</td>
              <td>30–31</td>
            </tr>
            <tr>
              <td>M</td>
              <td>38–39</td>
              <td>32–33</td>
            </tr>
            <tr>
              <td>L</td>
              <td>40–41</td>
              <td>34–35</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>42–44</td>
              <td>36–38</td>
            </tr>
            <tr>
              <td>XXL</td>
              <td>45–47</td>
              <td>39–41</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Numbered trouser and denim sizes refer to waist inches. Numbered suit sizes refer to chest
        inches. Free-size saris are draped garments; blouse tailoring is separate.
      </p>
      <h3>Kids — a guide by height</h3>
      <div class="table-wrap">
        <table class="size-table">
          <thead>
            <tr>
              <th>Age</th>
              <th>Height (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2–3 years</td>
              <td>92–98</td>
            </tr>
            <tr>
              <td>3–4 years</td>
              <td>98–104</td>
            </tr>
            <tr>
              <td>5–6 years</td>
              <td>110–116</td>
            </tr>
            <tr>
              <td>7–8 years</td>
              <td>122–128</td>
            </tr>
            <tr>
              <td>9–10 years</td>
              <td>134–140</td>
            </tr>
            <tr>
              <td>11–12 years</td>
              <td>146–152</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Age is approximate: check height and actual garment measurements when available. Baby pieces
        use month-based sizes from 0–3M through 18–24M.
      </p>
      <h3>How to measure</h3>
      <p>
        Keep the tape level and comfortably close. Measure around the fullest chest or bust, the
        natural waist, and the widest part of the hips. Compare those measurements with the final
        garment guide when shopping opens.
      </p>`,
  },
  care: {
    title: 'A little care goes a long way.',
    body: /* HTML */ `<p>
        Always follow the garment’s actual care label. The notes below are general guidance for
        looking after your wardrobe.
      </p>
      <h3>Everyday cotton and linen</h3>
      <p>
        Separate colours, choose a gentle wash when the label allows, and reshape while damp.
        Air-drying helps keep your pieces looking their best.
      </p>
      <h3>Knitwear</h3>
      <p>
        Fold rather than hang to help preserve the shape. Follow the care label for washing
        temperature and drying instructions.
      </p>
      <h3>Tailoring, satin, and festive pieces</h3>
      <p>
        Check the label before washing. Structured, embellished, and delicate pieces may require
        professional care. Keep embroidery and jewellery from catching on delicate fabrics.
      </p>
      <h3>Store thoughtfully</h3>
      <p>
        Give garments a little space, keep them dry, and keep colours away from prolonged direct
        sunlight.
      </p>`,
  },
  delivery: {
    title: 'Delivery & returns.',
    body: /* HTML */ `<p>
        This is a preview of the AURÉL store. Delivery, order fulfilment, and returns are not
        available yet.
      </p>
      <h3>Before shopping opens</h3>
      <p>
        Delivery areas, shipping charges, dispatch estimates, tax treatment, and a returns and
        exchanges policy will be published here before live checkout is enabled.
      </p>
      <p>
        No shipping promise or return window applies to this sample catalogue. You can explore the
        collection and preview checkout without placing an order.
      </p>`,
  },
  payments: {
    title: 'A payment method for you.',
    body: /* HTML */ `<p>
        The checkout preview includes UPI, credit and debit cards, PayPal, and net banking as
        selectable payment options.
      </p>
      <h3>Payment setup is pending</h3>
      <p>
        No payment provider is connected, and no payment or order is processed. Availability of each
        method, supported cards, and applicable charges will be confirmed when merchant checkout is
        connected.
      </p>
      <h3>Your details stay yours</h3>
      <p>
        This preview never asks for card numbers, UPI PINs, bank passwords, or PayPal credentials.
        Delivery fields are used only inside the open preview and are not sent to a server.
      </p>`,
  },
};
